import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { AppConfigService } from "../config/app-config.service";

@Injectable()
export class SecretEncryptionService {
  private readonly algorithm = "aes-256-gcm";

  constructor(private readonly appConfigService: AppConfigService) {}

  encrypt(plainText: string): string {
    const key = this.loadKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
  }

  decrypt(payload: string): string {
    const [ivBase64, tagBase64, encryptedBase64] = payload.split(":");

    if (!ivBase64 || !tagBase64 || !encryptedBase64) {
      throw new Error("Invalid encrypted payload format");
    }

    const key = this.loadKey();
    const decipher = createDecipheriv(this.algorithm, key, Buffer.from(ivBase64, "base64"));
    decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, "base64")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }

  private loadKey(): Buffer {
    const keyBase64 = this.appConfigService.secretsEncryptionKey;
    const key = Buffer.from(keyBase64, "base64");

    if (key.length !== 32) {
      throw new Error("SECRETS_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
    }

    return key;
  }
}
