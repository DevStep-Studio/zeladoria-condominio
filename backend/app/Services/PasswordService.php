<?php

namespace App\Services;

use Illuminate\Support\Facades\Hash;

final class PasswordService
{
    public function verify(string $password, string $stored): bool
    {
        // Compatibility with existing Node scrypt passwords. New passwords use Laravel hashing.
        if (preg_match('/^([a-f0-9]{32}):([a-f0-9]{64})$/D', $stored, $parts)) {
            $hash = sodium_crypto_pwhash_scryptsalsa208sha256(32, $password, $parts[1], 524288, 16777216);

            return hash_equals($parts[2], bin2hex($hash));
        }

        return password_verify($password, $stored);
    }

    public function hash(string $password): string
    {
        return Hash::make($password);
    }
}
