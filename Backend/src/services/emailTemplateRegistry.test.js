import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyPlaceholders,
  applyMailOverride,
  isValidTemplateKey,
  EMAIL_TEMPLATE_KEYS,
} from "./emailTemplateRegistry.js";

describe("emailTemplateRegistry", () => {
  it("registers the five editable templates with unique keys", () => {
    assert.equal(isValidTemplateKey("admin_credentials"), true);
    assert.equal(isValidTemplateKey("staff_credentials"), true);
    assert.equal(isValidTemplateKey("parent_notification"), true);
    assert.equal(isValidTemplateKey("moderation_notice"), true);
    assert.equal(isValidTemplateKey("announcement"), true);
    const keys = new Set(EMAIL_TEMPLATE_KEYS.map((t) => t.key));
    assert.equal(keys.size, EMAIL_TEMPLATE_KEYS.length);
  });

  it("replaces placeholders and escapes HTML-injected values", () => {
    const out = applyPlaceholders("Hi {{name}} at {{schoolName}}", {
      name: "<script>alert(1)</script>",
      schoolName: "Gulshan & Sons",
    });
    assert.equal(out, "Hi &lt;script&gt;alert(1)&lt;/script&gt; at Gulshan &amp; Sons");
  });

  it("keeps URL placeholders raw for href embedding", () => {
    const out = applyPlaceholders('<a href="{{loginUrl}}">Login</a>', {
      loginUrl: "https://x.com/login?a=1&b=2",
    });
    assert.equal(out, '<a href="https://x.com/login?a=1&b=2">Login</a>');
  });

  it("drops unknown and empty placeholders", () => {
    assert.equal(applyPlaceholders("a{{nope}}b{{password}}", { password: "" }), "ab");
  });

  it("applies a full override on top of the built-in mail", () => {
    const mail = { subject: "Built-in subject", html: "<p>built-in</p>" };
    const out = applyMailOverride(
      mail,
      { subject: "Hi {{name}}", bodyHtml: "<b>{{schoolName}}</b>" },
      { name: "Ali", schoolName: "Gulshan" }
    );
    assert.deepEqual(out, {
      subject: "Hi Ali",
      html: "<b>Gulshan</b>",
      overridden: true,
    });
  });

  it("keeps built-in parts that the override leaves empty", () => {
    const mail = { subject: "Welcome - Your Admin Credentials", html: "<p>b</p>" };
    const noSubject = applyMailOverride(mail, { subject: " ", bodyHtml: "<p>x</p>" }, {});
    assert.equal(noSubject.subject, "Welcome - Your Admin Credentials");
    assert.equal(noSubject.html, "<p>x</p>");

    const noBody = applyMailOverride(mail, { subject: "Mine", bodyHtml: "" }, {});
    assert.equal(noBody.subject, "Mine");
    assert.equal(noBody.html, "<p>b</p>");
  });

  it("returns the mail untouched when there is no override", () => {
    const mail = { subject: "s", html: "<p>h</p>" };
    const out = applyMailOverride(mail, null, {});
    assert.deepEqual(out, { ...mail, overridden: false });
  });
});