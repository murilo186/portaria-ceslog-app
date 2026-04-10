import { describe, expect, it } from "vitest";
import { sanitizeNullableText, sanitizeText } from "../src/utils/sanitize";

describe("sanitize utils", () => {
  it("remove tags HTML e caracteres de controle", () => {
    const result = sanitizeText("  <b>Nome</b>\u0000 \n<script>x</script>  ");
    expect(result).toBe("Nome x");
  });

  it("retorna null quando texto opcional fica vazio apos sanitizacao", () => {
    const result = sanitizeNullableText("   <script></script>   ");
    expect(result).toBeNull();
  });
});
