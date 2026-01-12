import { decodeJwtPayload, isJwtExpired } from './jwt.utils';

describe('jwt.utils', () => {
  function b64UrlEncode(obj: any): string {
    const json = JSON.stringify(obj);
    const base64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return base64;
  }

  function makeToken(payload: any): string {
    const header = b64UrlEncode({ alg: 'none', typ: 'JWT' });
    const body = b64UrlEncode(payload);
    return `${header}.${body}.sig`;
  }

  it('decodeJwtPayload devuelve null para token null o mal formado', () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload('a.b')).toBeNull();
    expect(decodeJwtPayload('a.b.c.d')).toBeNull();
  });

  it('decodeJwtPayload devuelve el payload cuando el token es válido', () => {
    const token = makeToken({ sub: 'u1', exp: 123 });
    expect(decodeJwtPayload(token)).toEqual({ sub: 'u1', exp: 123 });
  });

  it('decodeJwtPayload devuelve null cuando el payload no es JSON', () => {
    const badPayload = 'bm90LWpzb24';
    const token = `a.${badPayload}.c`;
    expect(decodeJwtPayload(token)).toBeNull();
  });

  it('isJwtExpired devuelve true si no hay exp o el token es inválido', () => {
    const token = makeToken({ sub: 'u1' });
    expect(isJwtExpired(token)).toBe(true);
    expect(isJwtExpired('a.b')).toBe(true);
  });

  it('isJwtExpired usa exp y offsetSeconds para determinar expiración', () => {
    spyOn(Date, 'now').and.returnValue(1_000_000);
    const nowSeconds = Math.floor(Date.now() / 1000);

    const future = makeToken({ exp: nowSeconds + 10 });
    const past = makeToken({ exp: nowSeconds - 1 });

    expect(isJwtExpired(future)).toBe(false);
    expect(isJwtExpired(future, 20)).toBe(true);
    expect(isJwtExpired(past)).toBe(true);
  });
});
