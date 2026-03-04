# Epaiement.ma Incident Response Plan

**Document Version:** 1.0  
**Effective Date:** January 2025  
**Classification:** Confidential

---

## 1. Purpose

This Incident Response Plan defines the procedures for detecting, responding to, and recovering from security incidents affecting Epaiement.ma, including potential cardholder data breaches.

---

## 2. Incident Definition

A security incident is any event that:
- Compromises the confidentiality, integrity, or availability of information
- Involves unauthorized access to systems or data
- Violates security policies or standards
- Results in actual or potential harm to Epaiement.ma or its customers

---

## 3. Incident Classification

### 3.1 Severity Levels

| Level | Definition | Examples |
|-------|------------|----------|
| **Critical** | Active breach, cardholder data exposed | Confirmed data exfiltration, ransomware attack |
| **High** | Confirmed security breach, limited impact | Unauthorized access detected, malware infection |
| **Medium** | Potential security issue | Suspicious activity, policy violation |
| **Low** | Minor security issue | Failed login attempts, phishing email received |

### 3.2 Response Times

| Severity | Initial Response | Containment | Resolution |
|----------|-----------------|-------------|------------|
| Critical | 15 minutes | 1 hour | 24 hours |
| High | 1 hour | 4 hours | 72 hours |
| Medium | 4 hours | 24 hours | 1 week |
| Low | 24 hours | 72 hours | 2 weeks |

---

## 4. Response Team

### 4.1 Team Structure

```
┌─────────────────────────────────────────┐
│          Incident Commander             │
│   (CTO / Security Officer)              │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌───▼───┐   ┌─────▼─────┐
│Technical│   │Communications│ │Legal/Compliance│
│ Lead   │   │    Lead     │ │     Lead      │
└───┬───┘   └─────┬───────┘ └───────┬───────┘
    │             │                   │
┌───▼───┐   ┌─────▼───────┐   ┌──────▼──────┐
│Security│   │Customer     │   │Regulatory   │
│Analysts│   │Communications│ │Liaison      │
└────────┘   └─────────────┘   └─────────────┘
```

### 4.2 Contact Information

| Role | Name | Phone | Email | Backup |
|------|------|-------|-------|--------|
| Incident Commander | [Name] | [Phone] | [Email] | [Backup] |
| Technical Lead | [Name] | [Phone] | [Email] | [Backup] |
| Communications Lead | [Name] | [Phone] | [Email] | [Backup] |
| Legal Lead | [Name] | [Phone] | [Email] | [Backup] |

---

## 5. Response Phases

### 5.1 Phase 1: Detection and Identification

**Triggers:**
- Automated security alerts
- User reports
- Third-party notification
- SIEM alerts
- Unusual activity patterns

**Actions:**
1. Verify the incident is legitimate
2. Document initial findings
3. Classify severity
4. Alert appropriate team members
5. Begin incident log

**Documentation:**
```
INCIDENT ID: INC-[DATE]-[NUMBER]
Date/Time Detected: 
Detected By: 
Initial Description:
Affected Systems:
Initial Classification:
```

### 5.2 Phase 2: Containment

**Immediate Actions:**
1. Isolate affected systems
2. Preserve evidence
3. Block malicious IPs/users
4. Reset compromised credentials
5. Enable additional logging

**Containment Strategies by Incident Type:**

| Incident Type | Containment Action |
|---------------|-------------------|
| Malware | Isolate system, block C2 communications |
| Unauthorized Access | Disable account, force password reset |
| Data Breach | Revoke access, isolate database |
| DDoS Attack | Enable DDoS protection, contact ISP |
| Ransomware | Isolate network, do not pay ransom |

### 5.3 Phase 3: Eradication

**Actions:**
1. Identify root cause
2. Remove malware/threats
3. Patch vulnerabilities
4. Update security controls
5. Verify system integrity

**Verification Checklist:**
- [ ] All malware removed
- [ ] All vulnerabilities patched
- [ ] All compromised accounts reset
- [ ] Security controls updated
- [ ] System integrity verified

### 5.4 Phase 4: Recovery

**Actions:**
1. Restore from clean backups (if needed)
2. Validate system functionality
3. Implement additional monitoring
4. Gradually restore services
5. Confirm normal operations

**Recovery Priority Order:**
1. Core payment processing systems
2. Customer-facing applications
3. Internal business systems
4. Development environments

### 5.5 Phase 5: Lessons Learned

**Post-Incident Review (within 7 days):**
1. Timeline reconstruction
2. Root cause analysis
3. Response effectiveness
4. Gap identification
5. Recommendations for improvement

**Documentation:**
- Incident summary report
- Timeline of events
- Actions taken
- Lessons learned
- Policy/procedure updates needed

---

## 6. Notification Procedures

### 6.1 Internal Notifications

| Stakeholder | When | Method |
|-------------|------|--------|
| Executive Team | Critical/High incidents | Phone + Email |
| Legal Team | Any breach | Phone + Email |
| HR | Employee-involved incidents | Email |
| All Staff | If business impact | Email |

### 6.2 External Notifications

| Entity | Timeline | Trigger |
|--------|----------|---------|
| Payment Brands | Within 24 hours | Confirmed card data breach |
| Acquiring Bank | Within 24 hours | Confirmed card data breach |
| Affected Customers | Without undue delay | Personal data breach |
| DPA (Morocco) | Within 72 hours | Personal data breach |
| Law Enforcement | As required | Criminal activity |

### 6.3 Notification Templates

**Customer Notification Template:**
```
Subject: Important Security Notice from Epaiement.ma

Dear [Customer],

We are writing to inform you of a security incident that may have 
affected your personal information.

What Happened:
[Description of incident]

What Information Was Involved:
[Types of data affected]

What We Are Doing:
[Actions taken]

What You Can Do:
[Recommended actions]

For More Information:
[Contact details]
```

---

## 7. Communication Guidelines

### 7.1 Internal Communication

- All communications via secure channels
- No external discussion without authorization
- Use incident ID in all communications
- Regular status updates to stakeholders

### 7.2 External Communication

- Only designated spokesperson(s) speak externally
- No speculation or blame
- Focus on facts and remediation
- Coordinate with legal before any statements

### 7.3 Media Response

```
"Our security team identified and responded to a security 
incident. We have taken immediate steps to secure our systems 
and are working with relevant authorities. We take the security 
of our customers' information seriously and are committed to 
transparency throughout this process."
```

---

## 8. Evidence Preservation

### 8.1 Types of Evidence

- Log files (system, application, network)
- Network traffic captures
- Malware samples
- Email headers/content
- Screenshots
- Witness statements

### 8.2 Chain of Custody

```
EVIDENCE LOG
------------
Evidence ID: 
Description:
Collected By:
Date/Time:
Location:
Hash Value:
Storage Location:
Access Log:
| Date | Person | Reason | Signature |
|------|--------|--------|-----------|
```

### 8.3 Retention

- Evidence retained for 7 years minimum
- Secure storage with access controls
- Regular integrity verification

---

## 9. Specific Incident Playbooks

### 9.1 Cardholder Data Breach

1. **Immediate (0-1 hour)**
   - Notify Incident Commander
   - Isolate affected systems
   - Preserve logs and evidence
   - Contact acquiring bank

2. **Short-term (1-24 hours)**
   - Engage forensic investigators (if needed)
   - Determine scope of breach
   - Notify card brands
   - Begin customer notification planning

3. **Medium-term (1-7 days)**
   - Complete forensic investigation
   - Implement additional controls
   - Execute customer notifications
   - Coordinate with regulators

### 9.2 Ransomware Attack

1. **Immediate**
   - Disconnect affected systems
   - Do NOT pay ransom
   - Activate incident response team
   - Assess backup integrity

2. **Short-term**
   - Identify ransomware variant
   - Check for data exfiltration
   - Begin recovery from backups
   - Report to authorities

3. **Recovery**
   - Rebuild systems from clean media
   - Patch vulnerability used
   - Enhance monitoring
   - Conduct security training

### 9.3 Phishing Attack

1. **Immediate**
   - Block sender/phishing URL
   - Identify affected users
   - Reset compromised credentials
   - Warn other users

2. **Short-term**
   - Analyze phishing email
   - Check for successful compromises
   - Update email filters
   - Document for training

---

## 10. Testing and Maintenance

### 10.1 Testing Schedule

| Test Type | Frequency | Participants |
|-----------|-----------|--------------|
| Tabletop exercise | Quarterly | Response team |
| Technical drill | Semi-annual | IT/Security team |
| Full simulation | Annual | All stakeholders |

### 10.2 Plan Review

- Annual review of this plan
- Update after each incident
- Update when infrastructure changes
- Update when regulations change

---

## 11. Tools and Resources

### 11.1 Incident Response Tools

- SIEM: Centralized logging and alerting
- EDR: Endpoint detection and response
- Forensics: Disk and memory analysis tools
- Communication: Secure messaging platform

### 11.2 External Resources

- CNI-CERT (Morocco): https://www.cni-cert.ma
- FIRST: https://www.first.org
- PCI SSC: https://www.pcisecuritystandards.org

---

## 12. Appendices

### Appendix A: Incident Report Form

```
INCIDENT REPORT
==============

Incident ID: 
Date/Time Reported:
Reported By:

Classification:
[ ] Critical  [ ] High  [ ] Medium  [ ] Low

Description:


Affected Systems:


Evidence Collected:


Actions Taken:


Current Status:


Next Steps:


```

### Appendix B: Contact Directory

[Updated quarterly - see secure internal wiki]

### Appendix C: Vendor Contact List

| Service | Vendor | Contact | Account # |
|---------|--------|---------|-----------|
| Hosting | Vercel | [Contact] | [Account] |
| Payment Gateway | CMI | [Contact] | [Account] |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Security Team | Initial release |

---

*This document is confidential and should only be shared with authorized personnel.*
