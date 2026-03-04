# Epaiement.ma Information Security Policy

**Document Version:** 1.0  
**Effective Date:** January 2025  
**Last Review:** January 2025  
**Next Review:** January 2026  
**Document Owner:** Security Team  
**Classification:** Internal

---

## 1. Purpose

This Information Security Policy establishes the framework for protecting Epaiement.ma's information assets, including cardholder data, personal information, and business-critical systems. This policy ensures compliance with:

- Payment Card Industry Data Security Standard (PCI DSS) v4.0
- Moroccan Data Protection Law (Law 09-08)
- General Data Protection Regulation (GDPR) where applicable

---

## 2. Scope

This policy applies to:

- All employees, contractors, and third-party vendors
- All systems, networks, and applications processing, storing, or transmitting cardholder data
- All business processes involving sensitive information
- All physical locations where cardholder data is processed

---

## 3. Policy Statements

### 3.1 Information Security Program

Epaiement.ma shall maintain an information security program that includes:

1. **Risk Assessment**: Annual risk assessments identifying threats, vulnerabilities, and controls
2. **Security Controls**: Technical and procedural controls aligned with PCI DSS requirements
3. **Continuous Monitoring**: Real-time monitoring of security events and anomalies
4. **Incident Response**: Documented procedures for responding to security incidents

### 3.2 Security Organization

| Role | Responsibilities |
|------|------------------|
| Executive Management | Approve security policies, allocate resources |
| Security Team | Implement controls, monitor compliance, respond to incidents |
| IT Department | Maintain secure systems, apply patches, manage access |
| All Employees | Follow security policies, report incidents |

### 3.3 Asset Management

- All information assets must be inventoried and classified
- Asset ownership must be clearly defined
- Assets must be protected according to their classification level

**Data Classification Levels:**

| Level | Description | Examples |
|-------|-------------|----------|
| Public | No restrictions | Marketing materials, public website |
| Internal | Internal use only | Internal documents, procedures |
| Confidential | Business sensitive | Client data, financial reports |
| Restricted | Highest protection | Cardholder data, authentication credentials |

---

## 4. Access Control

### 4.1 User Access Management

- Access granted on need-to-know basis only
- Unique user IDs required for all users
- Access rights reviewed quarterly
- Access revoked within 24 hours of termination

### 4.2 Authentication Requirements

| Requirement | Standard |
|-------------|----------|
| Password length | Minimum 8 characters |
| Password complexity | Upper, lower, number, special char |
| Password age | Maximum 90 days |
| Password history | Last 4 passwords |
| Failed attempts | Account lockout after 6 attempts |
| Session timeout | 15 minutes inactivity |

### 4.3 Multi-Factor Authentication

MFA is required for:
- All administrative access
- Remote access to network
- Access to cardholder data environment
- All users with elevated privileges

### 4.4 Access Reviews

- Quarterly access reviews for all users
- Annual review of privileged accounts
- Documented approval for access changes

---

## 5. Network Security

### 5.1 Firewall Configuration

- Firewalls implemented at all network boundaries
- Default deny-all policy
- Documentation of all firewall rules
- Quarterly review of firewall configurations

### 5.2 Network Segmentation

- Cardholder data environment (CDE) isolated
- Separate network segments for:
  - Production systems
  - Development/test environments
  - Administrative systems

### 5.3 Remote Access

- VPN required for all remote connections
- MFA required for VPN access
- No split tunneling allowed
- Session timeouts enforced

---

## 6. Data Protection

### 6.1 Cardholder Data Protection

| Data Element | Storage | Display | Transmission |
|--------------|---------|---------|---------------|
| PAN | Tokenized only | First 6/Last 4 | TLS 1.2+ |
| CVV/CVC | **NEVER STORED** | N/A | N/A |
| Expiry Date | Encrypted | Full | TLS 1.2+ |
| Cardholder Name | Encrypted | Full | TLS 1.2+ |

### 6.2 Encryption Standards

- **At Rest**: AES-256 encryption
- **In Transit**: TLS 1.2 or higher
- **Key Management**: Hardware Security Module (HSM) or equivalent
- **Key Rotation**: Annual minimum

### 6.3 Data Retention

| Data Type | Retention Period | Disposal Method |
|-----------|------------------|-----------------|
| Transaction records | 7 years | Secure deletion |
| Audit logs | 1 year minimum | Secure deletion |
| Cardholder data | As needed | Immediate purge |
| CVV codes | **NEVER RETAINED** | N/A |

---

## 7. Vulnerability Management

### 7.1 Vulnerability Scanning

| Scan Type | Frequency | Requirement |
|-----------|-----------|-------------|
| ASV Scan | Quarterly | PCI DSS 11.2.1 |
| Internal Scan | Monthly | Best practice |
| Web Application | Continuous | PCI DSS 11.3.2 |
| Penetration Test | Annual | PCI DSS 11.3.1 |

### 7.2 Remediation SLAs

| Severity | Remediation Deadline |
|----------|---------------------|
| Critical | 7 days |
| High | 30 days |
| Medium | 90 days |
| Low | 180 days |

### 7.3 Change Management

- All changes documented and approved
- Security review for all changes
- Rollback procedures required
- Testing in non-production environment

---

## 8. Logging and Monitoring

### 8.1 Logging Requirements

All security events must be logged including:
- User authentication (success/failure)
- Privilege escalation
- Access to cardholder data
- System configuration changes
- Security alerts

### 8.2 Log Retention

- Minimum 1 year retention
- At least 3 months immediately available online
- Logs protected from modification/deletion

### 8.3 Log Review

- Daily review of security events
- Weekly review of access logs
- Monthly review of privileged activities

---

## 9. Incident Response

### 9.1 Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Active breach, data exfiltration | 1 hour |
| High | Confirmed security incident | 4 hours |
| Medium | Potential security issue | 24 hours |
| Low | Policy violation, minor issue | 72 hours |

### 9.2 Response Team

| Role | Responsibility |
|------|----------------|
| Incident Commander | Overall response coordination |
| Technical Lead | Investigation and containment |
| Communications | Internal/external notifications |
| Legal | Regulatory compliance, law enforcement |

### 9.3 Notification Requirements

- Card brands within 24 hours of confirmed breach
- Affected customers without undue delay
- Regulatory bodies as required by law

---

## 10. Third-Party Security

### 10.1 Vendor Requirements

- Written security agreements required
- Annual attestation of PCI DSS compliance
- Right to audit clause in contracts
- Incident notification within 24 hours

### 10.2 Service Provider Management

- Maintain list of all service providers
- Annual review of provider compliance
- Documented responsibilities for each provider

---

## 11. Physical Security

### 11.1 Office Security

- Badge access required
- Visitor logging
- Clean desk policy
- Secure disposal of sensitive documents

### 11.2 Data Center Security (Cloud)

- Provided by Vercel (SOC 2 Type II certified)
- Physical access restricted to authorized personnel
- 24/7 monitoring and security

---

## 12. Security Awareness

### 12.1 Training Requirements

| Training | Frequency | Audience |
|----------|-----------|----------|
| Security fundamentals | Onboarding | All employees |
| Phishing awareness | Quarterly | All employees |
| PCI DSS overview | Annual | Developers, IT |
| Incident response | Annual | Response team |

### 12.2 Background Checks

- Criminal background checks for employees with access to cardholder data
- Re-checks for privileged roles every 3 years

---

## 13. Compliance

### 13.1 Policy Compliance

- Compliance monitored through audits and assessments
- Violations reported to management
- Disciplinary action for willful violations

### 13.2 Audit Schedule

| Audit Type | Frequency |
|------------|-----------|
| Internal security audit | Annual |
| PCI DSS assessment | Annual |
| Penetration test | Annual |
| ASV vulnerability scan | Quarterly |

---

## 14. Policy Exceptions

Exceptions to this policy must be:
1. Documented in writing
2. Approved by the Security Team
3. Time-limited
4. Compensating controls implemented

---

## 15. Policy Review

This policy shall be reviewed:
- Annually at minimum
- After significant security incidents
- Following changes to PCI DSS requirements
- When business operations change significantly

---

## 16. Enforcement

Non-compliance with this policy may result in:
- Written warning
- Suspension of access privileges
- Termination of employment
- Legal action where applicable

---

## 17. Related Documents

- Acceptable Use Policy
- Incident Response Plan
- Business Continuity Plan
- Data Classification Guide
- Vendor Management Policy
- Password Policy

---

## 18. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Security Team | Initial release |

---

## Approval

This Information Security Policy has been approved by:

**Executive Signature:** _________________________  
**Date:** _________________________  

**Security Officer Signature:** _________________________  
**Date:** _________________________  

---

*This document is confidential and intended for internal use only.*
