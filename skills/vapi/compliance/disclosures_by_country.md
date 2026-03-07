# Disclosures by Country — Vapi Voice Compliance

## Purpose
Before recording any call, the Vapi assistant MUST deliver the country-appropriate
disclosure. If `compliance-enforcer.checkComplianceGate(country, 'record')` returns
`allowed: false`, DO NOT record.

---

## United States (US)
**Requirement**: Varies by state. Default to two-party consent (California standard).
```
"This call may be recorded for quality and training purposes. 
By continuing this call, you consent to the recording."
```
**Must say within first 15 seconds of call.**

## Canada (CA)
**Requirement**: One-party consent federally, but best practice is two-party.
```
"This call may be recorded. Do you consent to continue?"
```

## Australia (AU)
**Requirement**: All parties must be informed.
```
"I'd like to let you know this call is being recorded for quality purposes."
```

## United Kingdom (GB)
**Requirement**: Must inform under GDPR / Data Protection Act.
```
"This call is recorded for quality and compliance purposes in accordance
with our privacy policy."
```

## New Zealand (NZ)
**Requirement**: One-party consent, but best practice is disclosure.
```
"Just to let you know, this call may be recorded."
```

## Germany (DE)
**Requirement**: Strict two-party consent under GDPR + German telecom law.
```
"Dieser Anruf wird zu Qualitätszwecken aufgezeichnet. 
Stimmen Sie der Aufzeichnung zu?"
```
**English fallback**: "This call may be recorded. Do you consent?"

## Sweden (SE)
```
"Det här samtalet kan komma att spelas in i kvalitetssyfte."
```

## Norway (NO)
```
"Denne samtalen kan bli tatt opp for kvalitetssikring."
```

## UAE (AE)
```
"This call may be recorded for quality and training purposes."
```

## Saudi Arabia (SA)
```
"This call may be recorded for quality purposes."
```
**Note**: Arabic disclosure may be required for Arabic-speaking contacts.

## South Africa (ZA)
```
"This call is being recorded for quality and regulatory compliance."
```

## Default (all other countries)
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
