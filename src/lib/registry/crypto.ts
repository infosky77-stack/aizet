// 명부 세션 토큰 암호화/복호화(순수) — AES-256-GCM, 키는 환경변수에서만.
//
// 원칙: 키(REGISTRY_ENC_KEY)는 process.env에서만 읽는다. 코드·DB·주석 어디에도
// 하드코딩하지 않는다. 키가 없거나 길이가 틀리면 조용히 넘어가지 않고 throw한다.
// 저장 포맷: base64( iv(12) ‖ authTag(16) ‖ ciphertext ). 빈 문자열은 빈 문자열로 통과.

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * 암호화 키 해석 — 명시 hex(테스트 주입) 우선, 없으면 REGISTRY_ENC_KEY. 32바이트(hex 64자)가
 * 아니면 throw. 키 로딩을 이 작은 함수 하나로 모아 테스트에서 주입 가능하게 한다.
 */
export function resolveEncKey(explicitHex?: string): Buffer {
  const hex = explicitHex ?? process.env.REGISTRY_ENC_KEY;
  if (!hex) {
    throw new Error('REGISTRY_ENC_KEY 미설정 — 32바이트(hex 64자) 키를 환경변수로 제공하세요');
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error('REGISTRY_ENC_KEY 길이 오류 — 32바이트(hex 64자)여야 합니다');
  }
  return key;
}

export function encryptToken(plain: string, keyHex?: string): string {
  if (plain === '') return '';
  const key = resolveEncKey(keyHex);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptToken(enc: string, keyHex?: string): string {
  if (enc === '') return '';
  const key = resolveEncKey(keyHex);
  const buf = Buffer.from(enc, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
