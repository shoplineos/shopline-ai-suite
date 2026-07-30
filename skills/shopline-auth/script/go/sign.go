package auth

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"math"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

// maxTimestampDrift is the maximum allowed time difference between
// the request timestamp and the current server time (10 minutes).
const maxTimestampDrift = 10 * time.Minute

// VerifySign verifies the HMAC-SHA256 signature of a SHOPLINE GET request.
//
// Algorithm (matches SHOPLINE developer documentation):
//  1. Remove the "sign" key from the query parameters.
//  2. Sort remaining keys alphabetically (ascending).
//  3. Concatenate as "key1=value1&key2=value2...".
//  4. Compute HMAC-SHA256(payload, appSecret) and hex-encode.
//  5. Compare with the received sign using constant-time comparison.
func VerifySign(appSecret string, params url.Values, receivedSign string) bool {
	// Copy params, excluding the "sign" field
	paramCopy := make(map[string]string)
	for k, v := range params {
		if k != "sign" && len(v) > 0 {
			paramCopy[k] = v[0]
		}
	}

	// Sort keys alphabetically
	keys := make([]string, 0, len(paramCopy))
	for k := range paramCopy {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Build the payload string: key1=value1&key2=value2
	var sb strings.Builder
	for i, k := range keys {
		if i > 0 {
			sb.WriteByte('&')
		}
		sb.WriteString(k)
		sb.WriteByte('=')
		sb.WriteString(paramCopy[k])
	}

	// Compute HMAC-SHA256 and compare
	mac := hmac.New(sha256.New, []byte(appSecret))
	mac.Write([]byte(sb.String()))
	expectedSign := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expectedSign), []byte(receivedSign))
}

// GeneratePostSign computes the HMAC-SHA256 signature for a SHOPLINE POST request.
//
// Used when calling SHOPLINE's OAuth token APIs (create / refresh).
// The signature source is: requestBodyString + timestamp, signed with appSecret.
func GeneratePostSign(body, timestamp, appSecret string) string {
	source := body + timestamp
	mac := hmac.New(sha256.New, []byte(appSecret))
	mac.Write([]byte(source))
	return hex.EncodeToString(mac.Sum(nil))
}

// VerifyWebhookSign verifies the HMAC-SHA256 signature of a SHOPLINE webhook POST request.
//
// SHOPLINE sends the signature in the "X-Shopline-Hmac-Sha256" HTTP header.
// The signature is computed as HMAC-SHA256(requestBody, appSecret), hex-encoded.
//
// The request body is fully read and then restored so that downstream handlers
// can still read it.
func VerifyWebhookSign(appSecret string, r *http.Request) (bool, []byte, error) {
	receivedSign := r.Header.Get("X-Shopline-Hmac-Sha256")
	if receivedSign == "" {
		return false, nil, nil
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		return false, nil, err
	}
	r.Body = io.NopCloser(bytes.NewReader(body))

	mac := hmac.New(sha256.New, []byte(appSecret))
	mac.Write(body)
	expectedSign := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expectedSign), []byte(receivedSign)), body, nil
}

// VerifyTimestamp checks whether the given Unix-millisecond timestamp string
// is within the allowed drift window (±10 min) of the current server time.
func VerifyTimestamp(timestampStr string) bool {
	ts, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return false
	}
	diff := time.Now().UnixMilli() - ts
	return math.Abs(float64(diff)) <= float64(maxTimestampDrift.Milliseconds())
}
