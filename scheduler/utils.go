package main

import (
	"crypto/aes"
	"crypto/cipher"
	"encoding/hex"
	"os"

	"golang.org/x/crypto/scrypt"
)

// getDbURL builds a pgsql connection url using environment variables
func getDbURL() string {
	url := "pgsql://"
	url += os.Getenv("DB_USER") + ":"
	url += os.Getenv("DB_PASSWORD") + "@"
	url += os.Getenv("DB_HOST") + "/"
	url += os.Getenv("DB_NAME")
	if os.Getenv("DB_SSL") == "disable" {
		url += "?sslmode=disable"
	}
	return url
}

// decipher password from database
func decipher(password string) string {
	key, _ := scrypt.Key([]byte(os.Getenv("SECRET")), []byte(os.Getenv("SALT")), 16384, 8, 1, 24)
	ciphertext, _ := hex.DecodeString(password)

	block, _ := aes.NewCipher(key)
	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(ciphertext, ciphertext)

	return string(ciphertext)
}
