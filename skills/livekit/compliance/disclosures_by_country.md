# Disclosures by Country — LiveKit Voice Compliance

## Purpose
Before recording any call, the LiveKit agent MUST deliver the country-appropriate
disclosure. If `compliance-enforcer.checkComplianceGate(country, 'record')` returns
`allowed: false`, DO NOT record.

---

## Tier A — Gold (10 Countries)

### United States (US)
**Requirement**: Varies by state. Default to two-party consent (California standard).
```
"This call may be recorded for quality and training purposes.
By continuing this call, you consent to the recording."
```
**Must say within first 15 seconds of call.**

### Canada (CA)
**Requirement**: One-party consent federally, but best practice is two-party.
```
"This call may be recorded. Do you consent to continue?"
```

### Australia (AU)
**Requirement**: All parties must be informed.
```
"I'd like to let you know this call is being recorded for quality purposes."
```

### United Kingdom (GB)
**Requirement**: Must inform under GDPR / Data Protection Act.
```
"This call is recorded for quality and compliance purposes in accordance
with our privacy policy."
```

### New Zealand (NZ)
**Requirement**: One-party consent, but best practice is disclosure.
```
"Just to let you know, this call may be recorded."
```

### South Africa (ZA)
**Requirement**: POPIA — must inform.
```
"This call is being recorded for quality and regulatory compliance under POPIA."
```

### Germany (DE)
**Requirement**: Strict two-party consent under GDPR + German telecom law.
```
"Dieser Anruf wird zu Qualitätszwecken aufgezeichnet.
Stimmen Sie der Aufzeichnung zu?"
```
**English fallback**: "This call may be recorded. Do you consent?"

### Netherlands (NL)
**Requirement**: GDPR — must inform.
```
"Dit gesprek kan worden opgenomen voor kwaliteitsdoeleinden."
```

### UAE (AE)
```
"This call may be recorded for quality and training purposes."
```

### Brazil (BR)
**Requirement**: LGPD — must inform and have lawful basis.
```
"Esta ligação pode ser gravada para fins de qualidade e conformidade com a LGPD."
```

---

## Tier B — Blue (18 Countries)

### Ireland (IE)
```
"This call is recorded for quality and compliance purposes under GDPR."
```

### Sweden (SE)
```
"Det här samtalet kan komma att spelas in i kvalitetssyfte."
```

### Norway (NO)
```
"Denne samtalen kan bli tatt opp for kvalitetssikring."
```

### Denmark (DK)
```
"Denne samtale kan blive optaget med henblik på kvalitetssikring."
```

### Finland (FI)
```
"Tämä puhelu voidaan nauhoittaa laadunvarmistustarkoituksessa."
```

### Belgium (BE)
```
"Cet appel peut être enregistré à des fins de qualité." (FR)
"Dit gesprek kan worden opgenomen voor kwaliteitsdoeleinden." (NL)
```

### Austria (AT)
```
"Dieser Anruf wird zu Qualitätszwecken aufgezeichnet. Stimmen Sie der Aufzeichnung zu?"
```

### Switzerland (CH)
```
"Dieser Anruf wird aufgezeichnet." (DE)
"Cet appel est enregistré." (FR)
"Questa chiamata viene registrata." (IT)
```

### Spain (ES)
```
"Esta llamada puede ser grabada con fines de calidad y formación."
```

### France (FR)
```
"Cet appel peut être enregistré à des fins de qualité et de conformité RGPD."
```

### Italy (IT)
```
"Questa chiamata potrebbe essere registrata a scopo di qualità e conformità GDPR."
```

### Portugal (PT)
```
"Esta chamada pode ser gravada para fins de qualidade e conformidade com o RGPD."
```

### Saudi Arabia (SA)
```
"This call may be recorded for quality purposes."
```
**Arabic**: "قد يتم تسجيل هذه المكالمة لأغراض الجودة."

### Qatar (QA)
```
"This call may be recorded for quality purposes."
```

### Mexico (MX)
```
"Esta llamada puede ser grabada con fines de calidad."
```

### India (IN)
```
"This call may be recorded for quality and training purposes."
```

### Indonesia (ID)
```
"Panggilan ini dapat direkam untuk tujuan kualitas."
```

### Thailand (TH)
```
"การโทรนี้อาจถูกบันทึกเพื่อวัตถุประสงค์ในการรักษาคุณภาพ"
```

---

## Tier C — Silver (26 Countries)

### Poland (PL)
```
"Ta rozmowa może być nagrywana w celach jakościowych."
```

### Czech Republic (CZ)
```
"Tento hovor může být nahráván za účelem zajištění kvality."
```

### Slovakia (SK)
```
"Tento hovor môže byť nahrávaný na účely zabezpečenia kvality."
```

### Hungary (HU)
```
"Ez a hívás minőségbiztosítási célból rögzítésre kerülhet."
```

### Japan (JP)
```
"品質向上のため、この通話を録音させていただく場合がございます。"
```

### South Korea (KR)
```
"품질 향상을 위해 이 통화가 녹음될 수 있습니다."
```

### Turkey (TR)
```
"Bu görüşme kalite amaçlı kaydedilebilir."
```

### Vietnam (VN)
```
"Cuộc gọi này có thể được ghi âm vì mục đích đảm bảo chất lượng."
```

### Philippines (PH)
```
"This call may be recorded for quality purposes."
```

### All remaining Tier C/D countries:
```
"This call may be recorded for quality and training purposes.
If you do not wish to be recorded, please let me know now."
```
**If the caller objects**: Disable recording immediately, continue call without recording.

---

## Recording Refusal Handling
If the caller says "don't record" or similar:
1. Immediately stop recording
2. Acknowledge: "Understood, I've stopped the recording."
3. Continue the call normally
4. Log: `recording_refused = true` in call metadata
