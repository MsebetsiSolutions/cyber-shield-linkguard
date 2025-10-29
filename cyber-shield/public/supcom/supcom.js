document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const welcomeForm = document.getElementById("welcome-form");
  const joinChatBtn = document.getElementById("join-chat-btn");
  const chatInterface = document.getElementById("chat-interface");
  const chatMessages = document.getElementById("chat-messages");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const currentChatAvatar = document.getElementById("current-chat-avatar");
  const currentChatTitle = document.getElementById("current-chat-title");
  const currentChatMembers = document.getElementById("current-chat-members");
  const usernameDisplay = document.getElementById("username");
  const exitChatBtn = document.querySelector(".exit-chat-btn");

  let currentUserFullName = "User";

  //======================================================
  // --------------- Predefined Responses ----------------
  //======================================================

  const predefinedResponses = [
    {
      keywords: [
        "hello",
        "hi",
        "hey",
        "greetings",
        "hola",
        "welcome",
        "good morning",
        "good afternoon",
      ],
      responses: [
        `Hello ${currentUserFullName}! Welcome to Linkguard Community Assistance. I'm here to help with all your cybersecurity questions.`,
        `Hi ${currentUserFullName}! I specialize in cybersecurity guidance. How can I assist you today?`,
        `Welcome ${currentUserFullName}! I'm your cybersecurity expert. What security topics can I help you with?`,
      ],
    },
    {
      keywords: [
        "what is cybersecurity",
        "cybersecurity definition",
        "define cybersecurity",
        "cyber security",
      ],
      responses: [
        "Cybersecurity is the practice of protecting computers, networks, and data from digital attacks. It includes preventing unauthorized access, damage, or theft of information.",
        "Cybersecurity means protecting internet-connected systems from digital threats. This includes hardware, software, and data protection against cyber attacks.",
        "Cybersecurity involves protecting networks, devices, and data from unauthorized access or criminal use. It ensures the safety of digital information.",
      ],
    },
    {
      keywords: [
        "cia",
        "cia triad",
        "confidentiality integrity availability",
        "security principles",
      ],
      responses: [
        "The CIA triad is three main principles of security: Confidentiality (keeping data private), Integrity (ensuring data is accurate), and Availability (making sure data is accessible when needed).",
        "CIA stands for Confidentiality, Integrity, and Availability. These are the core goals of information security. Confidentiality protects privacy, Integrity ensures accuracy, and Availability maintains access.",
        "The CIA triad is the foundation of cybersecurity: Confidentiality prevents unauthorized access, Integrity protects data from changes, and Availability ensures systems work when needed.",
      ],
    },
    {
      keywords: [
        "cloud storage",
        "cloud computing",
        "what is cloud",
        "cloud services",
      ],
      responses: [
        "Cloud storage saves your data on internet servers instead of your computer. Companies like Google Drive, Dropbox, and iCloud offer cloud storage services.",
        "Cloud storage lets you store files online so you can access them from any device with internet. It's like having a virtual hard drive on the internet.",
        "Cloud computing means using internet-based services instead of your own computer. This includes storage, software, and processing power accessed online.",
      ],
    },
    {
      keywords: [
        "email phishing",
        "avoid phishing",
        "phishing prevention",
        "spot phishing email",
      ],
      responses: [
        "To avoid email phishing: check sender addresses carefully, don't click suspicious links, verify requests for personal information, and use LinkGuard to scan suspicious URLs.",
        "Prevent phishing by: looking for spelling errors, checking if links match the website address, being careful with urgent requests, and never sharing passwords via email.",
        "Identify phishing emails by: examining the sender's email address, hovering over links to see the real destination, and being suspicious of unexpected attachments or login requests.",
      ],
    },
    {
      keywords: [
        "brute force",
        "brute force attack",
        "password attack",
        "prevent brute force",
      ],
      responses: [
        "Brute force attacks try many password combinations to break into accounts. Prevent them by using strong, unique passwords and enabling login attempt limits.",
        "A brute force attack uses automated tools to guess passwords. Protect yourself with long passwords, two-factor authentication, and account lockout after failed attempts.",
        "Brute force protection requires: complex passwords, account lockout policies, two-factor authentication, and monitoring for multiple failed login attempts.",
      ],
    },
    {
      keywords: [
        "network security",
        "secure network",
        "network protection",
        "wifi security",
      ],
      responses: [
        "Network security protects your internet connection. Use strong passwords, enable encryption, keep router software updated, and use firewalls.",
        "Secure your network by: changing default router passwords, using WPA3 encryption, disabling remote management, and creating a guest network for visitors.",
        "Protect your network with: strong encryption, regular firmware updates, network monitoring, and separating devices into different network segments.",
      ],
    },
    {
      keywords: [
        "login safe",
        "secure login",
        "safe authentication",
        "protect login",
      ],
      responses: [
        "For safe logins: use strong passwords, enable two-factor authentication, avoid public computers for sensitive accounts, and check for HTTPS in the address bar.",
        "Secure login practices include: unique passwords for each account, two-step verification, logging out of shared devices, and using password managers.",
        "Protect your logins by: creating complex passwords, using authentication apps instead of SMS codes, avoiding password reuse, and monitoring account activity.",
      ],
    },
    {
      keywords: [
        "register",
        "sign up",
        "create account",
        "account registration",
      ],
      responses: [
        "When registering for accounts: use a strong unique password, provide minimal personal information, enable security features, and use a dedicated email for important accounts.",
        "Safe account registration: choose strong passwords, use a secure email, enable available security options, and be careful about sharing personal details.",
        "For secure registration: create complex passwords, use two-factor authentication, verify email addresses, and avoid using social media for login when possible.",
      ],
    },
    {
      keywords: [
        "false url",
        "fake website",
        "identify fake url",
        "malicious link",
      ],
      responses: [
        "Identify false URLs by: checking for misspellings, looking at the domain name carefully, using LinkGuard to scan suspicious links, and avoiding shortened URLs.",
        "Spot fake websites by: examining the URL for odd characters, checking for HTTPS and security certificates, and using LinkGuard's URL scanning feature.",
        "Detect malicious links through: domain name inspection, SSL certificate verification, and using LinkGuard's comprehensive URL analysis tools.",
      ],
    },
    {
      keywords: [
        "linkguard scan url",
        "scan url",
        "check website",
        "url scanner",
      ],
      responses: [
        "Use LinkGuard to scan any URL by pasting it into our scanner. It checks for malware, phishing attempts, and other security threats automatically.",
        "LinkGuard's URL scanner analyzes websites for safety. It examines domain reputation, content safety, and potential threats before you visit.",
        "Scan suspicious URLs with LinkGuard to detect phishing sites, malware distribution, and other web-based threats quickly and accurately.",
      ],
    },
    {
      keywords: [
        "linkguard scan file",
        "scan file",
        "check file",
        "file scanner",
      ],
      responses: [
        "Use LinkGuard to scan files for viruses and malware. Upload any file to our scanner for immediate security analysis and threat detection.",
        "LinkGuard's file scanner checks documents, images, and programs for malicious content using multiple antivirus engines and behavioral analysis.",
        "Protect your computer by scanning downloaded files with LinkGuard before opening them. It detects viruses, trojans, and other malware effectively.",
      ],
    },
    {
      keywords: [
        "linkguard scan qr",
        "scan qr code",
        "check qr",
        "qr code scanner",
      ],
      responses: [
        "Use LinkGuard to scan QR codes safely. Our scanner checks where the QR code leads before you visit, preventing malicious redirects.",
        "LinkGuard's QR code scanner analyzes encoded URLs for safety. It verifies destinations and checks for phishing or malware threats.",
        "Scan QR codes with LinkGuard to ensure they lead to safe websites. It prevents QR code-based phishing and malware attacks effectively.",
      ],
    },
    {
      keywords: [
        "public wifi",
        "public wireless",
        "free wifi",
        "wifi security",
      ],
      responses: [
        "Public WiFi dangers include: data interception, fake hotspots, and malware distribution. Use VPNs, avoid sensitive activities, and verify network names.",
        "Risks of public WiFi: hackers can see your internet traffic, steal passwords, and install malware. Use a VPN and avoid banking or shopping on public networks.",
        "Public WiFi security tips: use a VPN for encryption, don't access sensitive accounts, turn off file sharing, and verify the official network name with staff.",
      ],
    },
    {
      keywords: [
        "scanner",
        "detect",
        "scan",
        "verify",
        "check",
        "virus scan",
        "malware scan",
        "threat detection",
      ],
      responses: [
        "Our scanner uses multiple methods to find threats. It checks files, URLs, and QR codes for viruses, phishing, and other security risks.",
        "The scanning system looks for known threats and suspicious behavior. It helps protect you from malware, fake websites, and dangerous downloads.",
        "For complete protection, our scanner examines content using advanced detection methods to identify both known and new security threats.",
      ],
    },
    {
      keywords: [
        "url",
        "link",
        "website",
        "phishing",
        "malicious website",
        "suspicious link",
        "website safety",
      ],
      responses: [
        "URL checking includes looking at domain reputation, security certificates, and content safety to determine if a website is safe to visit.",
        "Our link scanner examines multiple warning signs including domain age, hosting details, and known threat databases to assess website risks.",
        "Website safety analysis checks SSL security, content patterns, and potential threats to ensure you visit only safe and legitimate sites.",
      ],
    },
    {
      keywords: [
        "file",
        "upload",
        "malware",
        "virus",
        "infected",
        "trojan",
        "ransomware",
        "spyware",
        "adware",
      ],
      responses: [
        "File scanning looks for malicious code and suspicious behavior. It protects you from viruses, ransomware, and other harmful software.",
        "Our file checker uses multiple security engines to detect malware. It examines programs and documents for any potential threats.",
        "Advanced file analysis includes checking for hidden malware, suspicious code patterns, and behavior that might indicate security risks.",
      ],
    },
    {
      keywords: [
        "qr code",
        "qr scanner",
        "malicious qr",
        "quick response code",
        "barcode security",
      ],
      responses: [
        "QR code security checks the hidden website address before you visit. This prevents phishing and malware attacks through QR codes.",
        "Our QR scanner decodes and verifies the destination URL. It ensures QR codes lead to safe, legitimate websites.",
        "For QR code safety, we validate the target website and check for known threats before allowing any redirects to occur.",
      ],
    },
    {
      keywords: [
        "phishing",
        "phishing email",
        "suspicious email",
        "email scam",
        "spear phishing",
        "whaling",
      ],
      responses: [
        "Phishing detection looks at email details, sender information, and link safety to identify fake messages trying to steal information.",
        "Advanced phishing protection checks email authentication, content patterns, and known threat indicators to stop phishing attacks.",
        "For complete phishing defense, use email security features, verify suspicious messages, and never share sensitive information via email.",
      ],
    },
    {
      keywords: [
        "ransomware",
        "infected",
        "encrypted files",
        "ransom",
        "crypto malware",
        "file encryption attack",
      ],
      responses: [
        "Ransomware protection requires good backups, security software, and careful email habits to prevent file encryption attacks.",
        "Advanced ransomware detection looks for file encryption behavior and blocks suspicious activity before files get locked.",
        "For ransomware recovery, maintain offline backups, use security software, and avoid opening suspicious email attachments.",
      ],
    },
    {
      keywords: [
        "password",
        "strong password",
        "password security",
        "create password",
        "password manager",
        "passphrase",
      ],
      responses: [
        "Strong passwords should be long, complex, and unique for each account. Consider using passphrases or a password manager.",
        "Password security means using different passwords for different sites, making them hard to guess, and changing them regularly.",
        "For best password protection, use a mix of letters, numbers, and symbols, and enable two-factor authentication where available.",
      ],
    },
    {
      keywords: [
        "wifi",
        "home wifi",
        "wireless",
        "network security",
        "router",
        "wireless security",
        "wpa2",
        "wpa3",
      ],
      responses: [
        "WiFi security requires strong encryption, unique passwords, and regular updates to protect your wireless network.",
        "Secure your WiFi by using the latest encryption standards, changing default settings, and monitoring connected devices.",
        "For wireless protection, enable network encryption, create strong passwords, and keep your router software up to date.",
      ],
    },
    {
      keywords: [
        "social engineering",
        "manipulation",
        "psychological attack",
        "pretexting",
        "baiting",
        "quid pro quo",
      ],
      responses: [
        "Social engineering defense requires awareness training, verification procedures, and careful information sharing.",
        "Protect against social engineering by verifying identities, being careful with personal information, and questioning unusual requests.",
        "For organizational security, train staff to recognize manipulation attempts and establish clear procedures for sensitive requests.",
      ],
    },
    {
      keywords: [
        "2fa",
        "two factor",
        "multi factor",
        "authentication",
        "mfa",
        "two-step verification",
      ],
      responses: [
        "Two-factor authentication adds extra security by requiring both your password and a second verification method.",
        "MFA protection means using something you know (password) and something you have (phone or token) for account access.",
        "Enable two-factor authentication on important accounts for better security against password theft and unauthorized access.",
      ],
    },
    {
      keywords: [
        "vpn",
        "virtual private network",
        "privacy",
        "encrypt traffic",
        "remote access",
        "tunnel",
      ],
      responses: [
        "VPNs create secure connections for internet browsing, especially important on public WiFi networks.",
        "Virtual private networks encrypt your internet traffic, making it harder for others to see your online activities.",
        "Use VPNs for secure remote access and privacy protection, especially when using public or untrusted networks.",
      ],
    },
    {
      keywords: [
        "zero day",
        "zero-day",
        "unknown vulnerability",
        "0day",
        "unpatched vulnerability",
      ],
      responses: [
        "Zero-day protection requires multiple security layers since these are new threats without available patches.",
        "Advanced security systems use behavior monitoring and threat intelligence to detect new, unknown attacks.",
        "For zero-day defense, maintain updated systems, use security software, and follow safe browsing practices.",
      ],
    },
    {
      keywords: [
        "iot",
        "smart device",
        "internet of things",
        "smart home",
        "industrial iot",
        "iot security",
      ],
      responses: [
        "IoT security requires changing default passwords, regular updates, and network separation for connected devices.",
        "Protect smart devices by using strong passwords, disabling unused features, and keeping firmware updated.",
        "For IoT safety, research device security before purchase, segment networks, and monitor device behavior.",
      ],
    },
    {
      keywords: [
        "cloud",
        "cloud security",
        "cloud storage",
        "aws",
        "azure",
        "gcp",
        "cloud compliance",
      ],
      responses: [
        "Cloud security involves proper access controls, data encryption, and understanding shared security responsibilities.",
        "Protect cloud data with strong passwords, access management, and regular security reviews of cloud settings.",
        "For cloud safety, enable available security features, use encryption, and monitor account activity regularly.",
      ],
    },
    {
      keywords: [
        "mobile",
        "android",
        "ios",
        "phone security",
        "smartphone",
        "mobile device management",
      ],
      responses: [
        "Mobile security requires device encryption, careful app permissions, and regular software updates.",
        "Protect smartphones with screen locks, app vetting, and careful use of public WiFi networks.",
        "For mobile safety, use security features, download apps from official stores, and keep operating systems updated.",
      ],
    },
    {
      keywords: ["thank you", "thanks", "appreciate", "grateful", "helpful"],
      responses: [
        "You're welcome. Stay safe online and remember to use LinkGuard for scanning suspicious content.",
        "I'm glad I could help. Practice good security habits and stay informed about new threats.",
        "Happy to assist. Remember that cybersecurity requires ongoing attention and good practices.",
      ],
    },
    {
      keywords: [
        "help",
        "support",
        "issue",
        "problem",
        "trouble",
        "assistance",
      ],
      responses: [
        "I specialize in cybersecurity guidance. What specific security concerns can I help you with?",
        "As a cybersecurity expert, I can help with various security topics. What challenges are you facing?",
        "I'm here to provide security advice. Please describe your concern, and I'll offer guidance.",
      ],
    },
    {
      keywords: ["bye", "goodbye", "exit", "leave", "quit", "farewell"],
      responses: [
        "Stay safe online and use LinkGuard for your security scanning needs. Return anytime for help.",
        "Remember to practice good security habits. Come back if you have more questions.",
        "Maintain strong security practices. Feel free to return for additional cybersecurity guidance.",
      ],
    },
    {
      keywords: ["malware", "virus protection", "antivirus", "malware removal"],
      responses: [
        "Malware is malicious software designed to harm computers. Use antivirus software, keep systems updated, and avoid suspicious downloads for protection.",
        "Protect against malware by installing reputable antivirus software, enabling firewalls, and being careful with email attachments and downloads.",
        "Malware includes viruses, worms, and trojans. Prevent infections by using security software and practicing safe browsing habits.",
      ],
    },
    {
      keywords: [
        "data breach",
        "breach prevention",
        "data protection",
        "information security",
      ],
      responses: [
        "Data breaches occur when sensitive information is accessed without authorization. Prevent them with strong access controls and encryption.",
        "Protect against data breaches by implementing security measures like encryption, access controls, and regular security audits.",
        "Data breach prevention requires strong passwords, employee training, and monitoring systems for suspicious activity.",
      ],
    },
    {
      keywords: [
        "encryption",
        "data encryption",
        "encrypt files",
        "secure communication",
      ],
      responses: [
        "Encryption converts data into secure code to prevent unauthorized access. Use it for sensitive files and communications.",
        "Protect your data with encryption tools. This ensures only authorized people can read your information.",
        "Encryption is essential for securing emails, files, and online communications from prying eyes.",
      ],
    },
    {
      keywords: [
        "firewall",
        "network firewall",
        "firewall protection",
        "computer firewall",
      ],
      responses: [
        "A firewall acts as a barrier between your computer and the internet, blocking unauthorized access while allowing safe traffic.",
        "Firewalls monitor network traffic and block potential threats. Enable them on all your devices for better security.",
        "Use firewalls to protect your network from hackers and malicious software trying to access your systems.",
      ],
    },
    {
      keywords: ["backup", "data backup", "backup strategy", "recovery plan"],
      responses: [
        "Regular backups protect your data from loss due to ransomware, hardware failure, or accidents. Follow the 3-2-1 backup rule.",
        "Create backups of important files regularly. Store copies in different locations for maximum protection.",
        "A good backup strategy includes automatic backups, offsite storage, and regular testing of recovery procedures.",
      ],
    },
    {
      keywords: [
        "social media security",
        "facebook security",
        "instagram safety",
        "twitter security",
      ],
      responses: [
        "Protect social media accounts with strong passwords, privacy settings, and careful sharing of personal information.",
        "Social media safety involves reviewing privacy settings, being selective about friend requests, and avoiding oversharing.",
        "Secure social media by enabling two-factor authentication, using unique passwords, and being cautious about third-party apps.",
      ],
    },
    {
      keywords: [
        "online shopping",
        "ecommerce security",
        "shopping safety",
        "payment security",
      ],
      responses: [
        "Shop safely online by using reputable websites, checking for HTTPS, and using credit cards instead of debit cards.",
        "Protect yourself when shopping online: verify website security, use strong passwords, and monitor bank statements.",
        "Secure online shopping requires checking site reputation, using secure payment methods, and keeping software updated.",
      ],
    },
    {
      keywords: [
        "public computer",
        "shared computer",
        "internet cafe",
        "library computer",
      ],
      responses: [
        "When using public computers, avoid accessing sensitive accounts, clear browser history, and never save passwords.",
        "Public computer safety: don't access banking or email, use private browsing, and log out completely after use.",
        "Protect your information on shared computers by avoiding personal accounts and using incognito mode.",
      ],
    },
    {
      keywords: [
        "software update",
        "system update",
        "patch",
        "security update",
      ],
      responses: [
        "Regular software updates fix security vulnerabilities. Enable automatic updates for operating systems and applications.",
        "Keep all software updated to protect against known security threats. Updates often include important security patches.",
        "Software updates are crucial for security. They fix weaknesses that hackers could exploit to access your systems.",
      ],
    },
    {
      keywords: [
        "browser security",
        "chrome security",
        "firefox safety",
        "browser protection",
      ],
      responses: [
        "Secure your web browser by keeping it updated, using security extensions, and clearing cookies regularly.",
        "Browser security involves updating regularly, using ad blockers, and being careful with browser extensions.",
        "Protect your browser by disabling unnecessary plugins, using privacy settings, and avoiding suspicious websites.",
      ],
    },
    {
      keywords: [
        "email security",
        "secure email",
        "email protection",
        "gmail security",
      ],
      responses: [
        "Protect email accounts with strong passwords, two-factor authentication, and careful handling of attachments.",
        "Email security requires suspicious link awareness, attachment scanning, and regular password changes.",
        "Secure your email by using encryption, avoiding public WiFi for access, and being wary of phishing attempts.",
      ],
    },
    {
      keywords: [
        "remote work",
        "work from home",
        "remote access",
        "telecommuting security",
      ],
      responses: [
        "Secure remote work with VPNs, updated software, and separate work devices from personal ones when possible.",
        "Work from home security requires secure networks, company-approved software, and following IT policies.",
        "Protect remote work environments with encrypted connections, multi-factor authentication, and security training.",
      ],
    },
    {
      keywords: [
        "smart home",
        "home automation",
        "iot devices",
        "smart device security",
      ],
      responses: [
        "Secure smart home devices by changing default passwords, updating firmware, and using separate WiFi networks.",
        "Protect smart home systems with strong passwords, regular updates, and disabling unused features.",
        "Smart home security involves researching device security, network segmentation, and monitoring device activity.",
      ],
    },
    {
      keywords: [
        "cyber bullying",
        "online harassment",
        "internet safety",
        "digital citizenship",
      ],
      responses: [
        "Prevent cyber bullying by being kind online, reporting abusive behavior, and protecting personal information.",
        "Online safety involves thinking before posting, respecting others, and knowing how to report inappropriate content.",
        "Protect against online harassment by using privacy settings, blocking abusive users, and saving evidence of bullying.",
      ],
    },
    {
      keywords: [
        "parental controls",
        "child safety",
        "kids online",
        "family security",
      ],
      responses: [
        "Use parental controls to protect children online. Monitor activity, set time limits, and teach internet safety.",
        "Child online safety involves supervision, age-appropriate content, and open communication about internet risks.",
        "Protect children with parental control software, safe search settings, and education about online dangers.",
      ],
    },
    {
      keywords: [
        "identity theft",
        "identity protection",
        "prevent identity theft",
        "personal information security",
      ],
      responses: [
        "Prevent identity theft by securing personal information, monitoring credit reports, and using strong passwords.",
        "Protect against identity theft with credit monitoring, secure document storage, and careful sharing of personal data.",
        "Identity theft prevention requires shredding documents, using credit freezes, and being wary of phishing scams.",
      ],
    },
    {
      keywords: ["dark web", "deep web", "tor", "anonymous browsing"],
      responses: [
        "The dark web requires special browsers and contains both legal and illegal content. Use caution and legal awareness.",
        "Dark web access involves privacy tools but carries risks. Understand legal boundaries and security implications.",
        "While the dark web offers privacy, it also hosts illegal activities. Use legal caution and security measures.",
      ],
    },
    {
      keywords: [
        "cyber insurance",
        "security insurance",
        "data breach insurance",
      ],
      responses: [
        "Cyber insurance helps cover costs from data breaches and cyber attacks. Consider it for business protection.",
        "Cyber liability insurance provides financial protection against online threats and data breaches.",
        "Businesses should consider cyber insurance to cover costs from security incidents and data loss.",
      ],
    },
    {
      keywords: [
        "incident response",
        "security incident",
        "breach response",
        "security breach",
      ],
      responses: [
        "Have an incident response plan ready. This includes detection, containment, and recovery procedures.",
        "Prepare for security incidents with documented response plans and trained staff.",
        "Effective incident response requires preparation, clear roles, and regular practice of response procedures.",
      ],
    },
    {
      keywords: [
        "security audit",
        "security assessment",
        "vulnerability assessment",
        "security review",
      ],
      responses: [
        "Regular security audits identify weaknesses in your systems. Conduct them periodically for ongoing protection.",
        "Security assessments evaluate your protection measures and recommend improvements.",
        "Professional security audits help find vulnerabilities before attackers can exploit them.",
      ],
    },
    {
      keywords: [
        "compliance",
        "gdpr",
        "hipaa",
        "pci dss",
        "regulatory compliance",
      ],
      responses: [
        "Compliance means following laws and regulations for data protection. Understand requirements for your industry.",
        "Regulatory compliance involves meeting legal standards for data security and privacy protection.",
        "Stay compliant with data protection laws by understanding requirements and implementing necessary controls.",
      ],
    },
    {
      keywords: [
        "security training",
        "employee training",
        "security awareness",
        "staff education",
      ],
      responses: [
        "Security training teaches employees to recognize threats and follow safe practices.",
        "Regular security awareness training helps prevent human error that could lead to security breaches.",
        "Educate staff about phishing, password security, and safe internet usage through ongoing training.",
      ],
    },
    {
      keywords: [
        "business continuity",
        "disaster recovery",
        "continuity planning",
        "recovery strategy",
      ],
      responses: [
        "Business continuity plans ensure operations continue during disruptions. Include cybersecurity incident response.",
        "Disaster recovery planning prepares organizations to recover from security incidents and other disruptions.",
        "Develop business continuity plans that address cyber attacks, natural disasters, and other potential disruptions.",
      ],
    },
    {
      keywords: [
        "risk management",
        "security risk",
        "risk assessment",
        "risk analysis",
      ],
      responses: [
        "Risk management identifies potential security threats and implements measures to reduce their impact.",
        "Security risk assessment helps prioritize protection efforts based on potential impact and likelihood.",
        "Effective risk management involves identifying, assessing, and mitigating security threats to your organization.",
      ],
    },
    {
      keywords: [
        "security policy",
        "security procedures",
        "it policy",
        "security guidelines",
      ],
      responses: [
        "Security policies establish rules for protecting information and systems. Ensure all users understand and follow them.",
        "Develop clear security policies covering password requirements, data handling, and incident reporting.",
        "Comprehensive security policies provide guidelines for safe technology use and data protection.",
      ],
    },
    {
      keywords: [
        "access control",
        "user access",
        "permissions",
        "access management",
      ],
      responses: [
        "Access control limits system access to authorized users only. Implement principle of least privilege.",
        "Manage user access carefully, granting only necessary permissions for each person's role.",
        "Effective access control ensures users can only access information and systems needed for their work.",
      ],
    },
    {
      keywords: [
        "data classification",
        "information classification",
        "data categorization",
      ],
      responses: [
        "Data classification organizes information by sensitivity level, helping determine appropriate protection measures.",
        "Classify data based on sensitivity to apply appropriate security controls and handling procedures.",
        "Implement data classification to protect sensitive information with stronger security measures.",
      ],
    },
    {
      keywords: [
        "security monitoring",
        "system monitoring",
        "network monitoring",
        "activity monitoring",
      ],
      responses: [
        "Security monitoring detects suspicious activity and potential threats in real-time.",
        "Monitor systems and networks for unusual activity that might indicate security breaches.",
        "Continuous security monitoring helps identify and respond to threats before they cause significant damage.",
      ],
    },
    {
      keywords: [
        "threat intelligence",
        "security intelligence",
        "threat information",
      ],
      responses: [
        "Threat intelligence provides information about current cyber threats and attack methods.",
        "Use threat intelligence to stay informed about emerging security risks and attack trends.",
        "Threat intelligence helps organizations prepare for and defend against current cyber threats.",
      ],
    },
    {
      keywords: ["security framework", "security standard", "security model"],
      responses: [
        "Security frameworks provide structured approaches to implementing and managing security controls.",
        "Follow established security frameworks like NIST or ISO 27001 for comprehensive protection.",
        "Security frameworks offer best practices and guidelines for building effective security programs.",
      ],
    },
    {
      keywords: [
        "digital forensics",
        "computer forensics",
        "incident investigation",
      ],
      responses: [
        "Digital forensics investigates cyber incidents by collecting and analyzing digital evidence.",
        "Forensic analysis helps understand security incidents and identify how breaches occurred.",
        "Digital forensics provides crucial evidence for understanding and responding to security breaches.",
      ],
    },
    {
      keywords: ["penetration testing", "security testing", "ethical hacking"],
      responses: [
        "Penetration testing simulates attacks to identify security weaknesses before criminals can exploit them.",
        "Regular penetration testing helps find and fix vulnerabilities in systems and applications.",
        "Professional penetration testing provides realistic assessment of your security defenses.",
      ],
    },
    {
      keywords: [
        "security architecture",
        "security design",
        "system architecture",
      ],
      responses: [
        "Security architecture designs systems with built-in protection rather than adding security later.",
        "Design secure systems by considering security requirements from the beginning of development.",
        "Good security architecture integrates protection measures throughout system design and implementation.",
      ],
    },
    {
      keywords: ["cryptography", "crypto", "encryption algorithms"],
      responses: [
        "Cryptography uses mathematical techniques to secure information and communications.",
        "Modern cryptography provides methods for encryption, digital signatures, and secure authentication.",
        "Cryptographic techniques protect data confidentiality, integrity, and authenticity in digital systems.",
      ],
    },
    {
      keywords: [
        "blockchain security",
        "cryptocurrency security",
        "bitcoin security",
      ],
      responses: [
        "Blockchain security involves protecting cryptocurrency wallets and understanding smart contract risks.",
        "Secure cryptocurrency by using hardware wallets and understanding transaction security.",
        "Blockchain technology offers security benefits but requires careful management of private keys and wallets.",
      ],
    },
    {
      keywords: [
        "ai security",
        "machine learning security",
        "artificial intelligence protection",
      ],
      responses: [
        "AI security protects machine learning systems from manipulation and ensures reliable operation.",
        "Secure AI systems by protecting training data and monitoring for adversarial attacks.",
        "AI security involves ensuring machine learning models behave as intended and resist manipulation.",
      ],
    },
    {
      keywords: [
        "quantum computing",
        "quantum security",
        "post quantum cryptography",
      ],
      responses: [
        "Quantum computing may break current encryption methods. Prepare by understanding post-quantum cryptography.",
        "Quantum-resistant cryptography will protect data against future quantum computer attacks.",
        "Prepare for quantum computing by planning migration to quantum-resistant encryption algorithms.",
      ],
    },
    {
      keywords: [
        "supply chain security",
        "vendor security",
        "third party risk",
      ],
      responses: [
        "Supply chain security protects against attacks through vendors and software dependencies.",
        "Manage third-party risk by vetting vendors and monitoring their security practices.",
        "Supply chain attacks target weaknesses in vendor products and services. Implement vendor risk management.",
      ],
    },
    {
      keywords: [
        "zero trust",
        "zero trust architecture",
        "never trust always verify",
      ],
      responses: [
        "Zero trust security assumes no user or device should be trusted by default, even inside the network.",
        "Implement zero trust by verifying every access request regardless of source or location.",
        "Zero trust architecture provides enhanced security by continuously validating access requests.",
      ],
    },
    {
      keywords: ["security automation", "soar", "security orchestration"],
      responses: [
        "Security automation uses technology to handle routine security tasks and respond to incidents faster.",
        "Automate security processes to improve efficiency and response time for common threats.",
        "Security automation helps security teams focus on complex threats by handling repetitive tasks automatically.",
      ],
    },
    {
      keywords: [
        "cloud security",
        "cloud protection",
        "aws security",
        "azure security",
      ],
      responses: [
        "Cloud security requires understanding shared responsibility between cloud providers and customers.",
        "Protect cloud environments with proper configuration, access controls, and monitoring.",
        "Cloud security involves securing data, applications, and infrastructure in cloud computing environments.",
      ],
    },
    {
      keywords: ["mobile security", "smartphone security", "tablet security"],
      responses: [
        "Mobile device security protects smartphones and tablets from threats through apps and networks.",
        "Secure mobile devices with screen locks, app permissions management, and regular updates.",
        "Mobile security involves protecting devices, data, and applications on smartphones and tablets.",
      ],
    },
    {
      keywords: [
        "iot security",
        "internet of things protection",
        "smart device security",
      ],
      responses: [
        "IoT security protects internet-connected devices from hacking and unauthorized access.",
        "Secure IoT devices by changing default passwords, updating firmware, and network segmentation.",
        "IoT security addresses unique challenges of protecting connected devices with limited computing resources.",
      ],
    },
    {
      keywords: [
        "what is hacking",
        "hacker",
        "types of hackers",
        "ethical hacking",
      ],
      responses: [
        "Hacking involves finding weaknesses in computer systems. Ethical hackers help improve security, while malicious hackers cause harm.",
        "Hackers use technical skills to access systems. White hat hackers help security, black hat hackers break laws.",
        "Understanding hacking helps protect against attacks. Ethical hacking tests defenses, while criminal hacking steals data.",
      ],
    },
    {
      keywords: ["cyber attack", "types of cyber attacks", "common attacks"],
      responses: [
        "Common cyber attacks include phishing, malware, ransomware, and denial-of-service attacks.",
        "Cyber attacks target computers and networks to steal data, cause damage, or disrupt services.",
        "Understanding different types of cyber attacks helps organizations prepare appropriate defenses.",
      ],
    },
    {
      keywords: ["security best practices", "cyber hygiene", "security basics"],
      responses: [
        "Basic security practices include strong passwords, software updates, and careful email handling.",
        "Good cyber hygiene involves regular security maintenance and safe online behavior.",
        "Follow security best practices like multi-factor authentication and regular backups for basic protection.",
      ],
    },
    {
      keywords: ["cyber threat", "emerging threats", "new security risks"],
      responses: [
        "Stay informed about emerging cyber threats like AI-powered attacks and supply chain compromises.",
        "New security threats constantly emerge. Continuous learning and adaptation are essential for protection.",
        "Emerging cyber threats include sophisticated phishing, ransomware-as-a-service, and IoT device attacks.",
      ],
    },
    {
      keywords: [
        "security tools",
        "cybersecurity software",
        "protection tools",
      ],
      responses: [
        "Essential security tools include antivirus software, firewalls, password managers, and VPNs.",
        "Use security tools like intrusion detection systems and vulnerability scanners for comprehensive protection.",
        "Security tools help automate protection and detect threats across networks and systems.",
      ],
    },
    {
      keywords: [
        "career in cybersecurity",
        "cybersecurity jobs",
        "security careers",
      ],
      responses: [
        "Cybersecurity careers include roles like security analyst, penetration tester, and security architect.",
        "The cybersecurity field offers diverse career opportunities with growing demand for skilled professionals.",
        "Cybersecurity careers require technical skills, continuous learning, and understanding of security principles.",
      ],
    },
    {
      keywords: [
        "cybersecurity certification",
        "security certification",
        "professional certification",
      ],
      responses: [
        "Popular cybersecurity certifications include CISSP, CEH, and Security+ for career advancement.",
        "Professional certifications validate cybersecurity skills and knowledge for career development.",
        "Cybersecurity certifications demonstrate expertise and help professionals advance in security careers.",
      ],
    },
    {
      keywords: [
        "security awareness month",
        "cybersecurity awareness",
        "security education",
      ],
      responses: [
        "Cybersecurity Awareness Month in October promotes security education and best practices.",
        "Security awareness campaigns help educate people about online safety and threat protection.",
        "Security awareness programs teach individuals and organizations how to protect against cyber threats.",
      ],
    },
    {
      keywords: ["cyber law", "computer crime law", "digital legislation"],
      responses: [
        "Cyber laws address computer crimes, data protection, and digital rights in the legal system.",
        "Understanding cyber law helps organizations comply with regulations and protect against legal issues.",
        "Cyber law encompasses legislation related to computer crimes, data privacy, and digital transactions.",
      ],
    },
    {
      keywords: ["digital privacy", "online privacy", "privacy protection"],
      responses: [
        "Digital privacy involves controlling personal information shared online and understanding data collection practices.",
        "Protect online privacy by reviewing privacy settings, using encryption, and being selective about data sharing.",
        "Digital privacy protection requires understanding how companies collect and use personal data online.",
      ],
    },
  ];

  //======================================================
  // ----------------- Advanced Matching -----------------
  //======================================================

  class ResponseMatcher {
    constructor(responses) {
      this.responses = responses;
    }

    calculateMatchScore(userQuestion, keywords) {
      const questionWords = userQuestion.toLowerCase().split(/\s+/);
      let score = 0;

      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();

        // Exact match
        if (userQuestion.toLowerCase().includes(keywordLower)) {
          score += 3;
        }

        for (const word of questionWords) {
          if (word === keywordLower) {
            score += 2;
          } else if (
            word.includes(keywordLower) ||
            keywordLower.includes(word)
          ) {
            score += 1;
          }
        }
      }

      return score;
    }

    findBestResponse(userQuestion) {
      let bestMatch = null;
      let highestScore = 0;

      for (const category of this.responses) {
        const score = this.calculateMatchScore(userQuestion, category.keywords);

        if (score > highestScore) {
          highestScore = score;
          bestMatch = category;
        }
      }

      if (bestMatch && highestScore >= 2) {
        const randomIndex = Math.floor(
          Math.random() * bestMatch.responses.length
        );
        return bestMatch.responses[randomIndex];
      }

      return null;
    }
  }

  // Initialize the matcher
  const responseMatcher = new ResponseMatcher(predefinedResponses);

  //======================================================
  // -------------------- Functions ----------------------
  //======================================================

  // Fetch and display current member count
  async function updateMemberCount() {
    try {
      const response = await fetch("/api/chats/member_count");
      if (!response.ok) {
        throw new Error("Failed to fetch member count");
      }
      const data = await response.json();
      currentChatMembers.textContent = `${data.member_count} members`;
    } catch (error) {
      console.error("Error fetching member count:", error);
      currentChatMembers.textContent = "Online now";
    }
  }

  // Get AI-powered answer using advanced matching
  function getAIAnswer(userQuestion) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = responseMatcher.findBestResponse(userQuestion);

        if (response) {
          resolve(response);
        } else {
          resolve(
            "I specialize in cybersecurity guidance. Could you please rephrase your question or ask about specific security topics like phishing protection, password security, network safety, or using LinkGuard for scanning?"
          );
        }
      }, 800 + Math.random() * 800);
    });
  }

  // Initialize page by checking authentication and chat status
  async function initializePage() {
    try {
      const userResponse = await fetch("/api/auth/me");
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();

      if (userData.authenticated) {
        currentUserFullName = userData.full_name || "User";
        usernameDisplay.textContent = currentUserFullName;
        document.getElementById(
          "welcome-message"
        ).textContent = `Hello ${currentUserFullName}! Welcome to Linkguard Community Assistance.`;

        try {
          const chatJoinedResponse = await fetch("/api/chats/check_joined");
          if (chatJoinedResponse.ok) {
            const chatJoinedData = await chatJoinedResponse.json();
            if (chatJoinedData.joined) {
              showChatInterface();
              return;
            }
          }
        } catch (error) {
          console.error("Error checking join status:", error);
        }

        welcomeForm.style.display = "flex";
        updateMemberCount();
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error initializing page:", error);
      document.getElementById(
        "welcome-message"
      ).textContent = `Welcome to Linkguard Community Assistance!`;
      welcomeForm.style.display = "flex";
      currentChatMembers.textContent = "Online now";
    }
  }

  // Show the chat interface
  function showChatInterface() {
    welcomeForm.style.display = "none";
    chatInterface.style.display = "flex";
    scrollToBottom();
    addHelpIcon();

    // Update initial message
    const initialMessage = document.querySelector(
      ".message.received .message-bubble"
    );
    if (initialMessage) {
      initialMessage.innerHTML = `
                <p>Hello! Welcome to Linkguard Community Assistance.</p>
                <p>I'm your cybersecurity expert here to help with security questions. I can assist with phishing protection, password security, network safety, and using LinkGuard scanners.</p>
                <p>Ask me about cybersecurity basics, threat protection, or how to use LinkGuard to scan URLs, files, and QR codes safely.</p>
            `;
    }
  }

  // Add help icon to chat input
  function addHelpIcon() {
    const chatInput = document.querySelector(".chat-input");
    const helpIcon = document.createElement("div");
    helpIcon.className = "help-icon";
    helpIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
    helpIcon.title = "Click for tips on asking questions";

    helpIcon.addEventListener("click", showHelpModal);
    chatInput.insertBefore(helpIcon, chatInput.firstChild);
  }

  // Display modal with question tips
  function showHelpModal() {
    const modal = document.createElement("div");
    modal.className = "help-modal";
    modal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h3>Cybersecurity Help Topics</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="help-modal-body">
                    <p>For cybersecurity guidance, consider asking about:</p>
                    <ul>
                        <li><strong>Basic Concepts:</strong> "What is cybersecurity?" or "What is the CIA triad?"</li>
                        <li><strong>Threat Protection:</strong> "How to avoid email phishing?" or "Prevent brute force attacks"</li>
                        <li><strong>Network Security:</strong> "Secure home WiFi" or "Public WiFi dangers"</li>
                        <li><strong>Account Safety:</strong> "Create strong passwords" or "Safe login practices"</li>
                        <li><strong>LinkGuard Tools:</strong> "Scan URL with LinkGuard" or "Check file safety"</li>
                        <li><strong>Cloud Security:</strong> "What is cloud storage?" or "Cloud safety tips"</li>
                    </ul>
                    <p>I provide clear, simple explanations for all cybersecurity topics.</p>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    modal.querySelector(".close-modal").addEventListener("click", function () {
      document.body.removeChild(modal);
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Send message to chat
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
      const now = new Date();
      const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Add user message to chat
      const messageElement = document.createElement("div");
      messageElement.classList.add("message", "sent");

      messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${message}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;

      chatMessages.appendChild(messageElement);
      messageInput.value = "";
      scrollToBottom();

      showTypingIndicator();

      try {
        const aiResponse = await getAIAnswer(message);

        removeTypingIndicator();
        showAIResponse(aiResponse);
      } catch (error) {
        removeTypingIndicator();
        showAIResponse(
          "I'm having trouble processing your question. Please try rephrasing or ask about specific cybersecurity topics."
        );
      }
    }
  }

  // Show typing indicator
  function showTypingIndicator() {
    const typingElement = document.createElement("div");
    typingElement.classList.add("message", "received");
    typingElement.id = "typing-indicator";

    typingElement.innerHTML = `
            <div class="message-avatar">
                <img src="../assets/com/CyberShieldCommunity.png" alt="AI Avatar">
            </div>
            <div class="message-content">
                <div class="message-sender">LCA Assistant</div>
                <div class="message-bubble">
                    <p><i class="fas fa-ellipsis-h"></i> LCA is typing...</p>
                </div>
            </div>
        `;

    chatMessages.appendChild(typingElement);
    scrollToBottom();
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Show AI response in chat
  function showAIResponse(response) {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const messageElement = document.createElement("div");
    messageElement.classList.add("message", "received");

    messageElement.innerHTML = `
            <div class="message-avatar">
                <img src="../assets/com/CyberShieldCommunity.png" alt="AI Avatar">
            </div>
            <div class="message-content">
                <div class="message-sender">LCA Assistant</div>
                <div class="message-bubble">
                    <p>${response}</p>
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;

    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }

  // Scroll chat messages to bottom
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Show exit confirmation modal
  function showExitConfirmation() {
    const modal = document.createElement("div");
    modal.className = "help-modal";
    modal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h3>Exit LCA Assistant</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="help-modal-body">
                    <p>Are you sure you want to exit the Linkguard Community Assistance chat?</p>
                    <p>You can always return if you have more cybersecurity questions.</p>
                    <div class="exit-confirmation-buttons">
                        <button id="confirm-exit" class="confirm-exit-btn">Yes, Exit Chat</button>
                        <button id="cancel-exit" class="cancel-exit-btn">Stay in Chat</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Confirm exit handler
    modal.querySelector("#confirm-exit").addEventListener("click", function () {
      window.location.href = "../ScannerDash/ScannerDash.html";
    });

    // Cancel exit handler
    modal.querySelector("#cancel-exit").addEventListener("click", function () {
      document.body.removeChild(modal);
    });

    // Close modal handlers
    modal.querySelector(".close-modal").addEventListener("click", function () {
      document.body.removeChild(modal);
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  //======================================================
  // ---------------- Event Listeners -------------------
  //======================================================

  // Handle joining the chat
  joinChatBtn.addEventListener("click", async function () {
    joinChatBtn.disabled = true;
    joinChatBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';

    try {
      const response = await fetch("/api/chats/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        if (data.joined) {
          showChatInterface();
          updateMemberCount();
        } else {
          alert(data.message || "Failed to join chat");
        }
      } else {
        alert(data.error || "Failed to join chat. Please try again.");
      }
    } catch (error) {
      console.error("Network error when joining chat:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      joinChatBtn.disabled = false;
      joinChatBtn.innerHTML = '<i class="fas fa-comments"></i> Join LCA Chat';
    }
  });

  // Send message handlers
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Update welcome content
  document.querySelector(".welcome-info p").textContent =
    "This platform is dedicated to:";
  document.querySelector(".welcome-info ul").innerHTML = `
        <li><i class="fas fa-shield-alt"></i> Cybersecurity guidance and support</li>
        <li><i class="fas fa-robot"></i> Threat protection advice</li>
        <li><i class="fas fa-lightbulb"></i> Security best practices</li>
        <li><i class="fas fa-users"></i> Community security assistance</li>
    `;

  // Exit chat with confirmation modal
  exitChatBtn.addEventListener("click", function (event) {
    event.preventDefault();
    showExitConfirmation();
  });

  //======================================================
  // ------------------ Initialize ----------------------
  //======================================================

  initializePage();
});
