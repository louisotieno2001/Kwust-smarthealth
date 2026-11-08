// Editable Typst report using the structure in docs/PP/doc.typ.
#set page(
  paper: "a4",
  margin: (
    top: 1in,
    bottom: 1in,
    right: 1in,
    left: 1.5in
  ),
)

#set text(size: 10pt)

#show outline.entry.where(
  level: 1
): it => {
  v(12pt, weak: true)
  strong(it)
}

#set par(
  justify: true,
  spacing: 1.5em
)

#align(center, grid(rows: (1fr, 1fr, 1fr, 1fr, 1fr), [
  #image("kwust.jpg", width: 20%)
  *KIRIRI WOMEN’S UNIVERSITY OF SCIENCE AND TECHNOLOGY*\
  FACULTY OF SCIENCE, DEPARTMENT OF COMPUTER SCIENCE AND IT\
  ],
  [#align(horizon, text(weight: "bold", fill: red, size: 16pt, [*SMART HEALTHCARE MANAGEMENT SYSTEM FOR KIRIRI WOMEN’S UNIVERSITY OF SCIENCE AND TECHNOLOGY*]))],
  [*BY*\
    JOYVENDER AWINO\
    KCS/063/24],
  [
    *SUPERVISOR*\
    // #line(length: 80%, stroke: (dash: "dashed"))
  ],
  align(bottom, [#line(length: 80%)
    A report submitted to the School of Computing in partial fulfilment of the requirements for a degree in Computer Science at Kiriri Women’s University of Science and Technology\
    2026])
))

#counter(page).update(0)
#pagebreak()
#set page(numbering: "i")

= Declaration and Approval
=== Student Declaration
I, the undersigned, declare that this proposal is my original work and that it has not been presented in any other university or institution for academic credit.
#table(
  columns: (auto, auto),
  inset: 10pt,
  align: horizon,
  stroke: none,
  [Signature#line(length: 100%, stroke: (dash: "dashed"))],
  [Date#line(length: 100%, stroke: (dash: "dashed"))],
  [Student Name#line(length: 100%, stroke: (dash: "dashed"))],
  [Reg_No#line(length: 100%, stroke: (dash: "dashed"))],
)

=== University Supervisor’s Approval
#table(
  columns: (auto, auto),
  inset: 10pt,
  align: horizon,
  stroke: none,
  [Signature#line(length: 100%, stroke: (dash: "dashed"))],
  [Date#line(length: 100%, stroke: (dash: "dashed"))],
  [Name#line(length: 100%, stroke: (dash: "dashed"))],
  [Faculty#line(length: 100%, stroke: (dash: "dashed"))],
)

=== Head of Department’s Approval
#table(
  columns: (auto, auto),
  inset: 10pt,
  align: horizon,
  stroke: none,
  [Signature#line(length: 100%, stroke: (dash: "dashed"))],
  [Date#line(length: 100%, stroke: (dash: "dashed"))],
  [Name#line(length: 100%, stroke: (dash: "dashed"))],
  [Department#line(length: 100%, stroke: (dash: "dashed"))],
)

#pagebreak()

= Dedication
I dedicate this project to my beloved family, whose unwavering support, encouragement, and prayers have been my source of strength throughout my academic journey. To my parents, for instilling in me the values of hard work, resilience, and integrity. I also dedicate this work to my lecturers and supervisor, whose guidance and mentorship have shaped my knowledge and inspired me to pursue excellence.

#pagebreak()

= Acknowledgement
I would like to express my sincere gratitude and appreciation to all those who have 
contributed to the successful completion of this project research. This endeavor has 
been a significant learning experience, and I am truly thankful for the support and 
guidance received. 

I  extend  my  heartfelt  appreciation  to  the  project  for  their  valuable  insights. 
Encouragements and constructive feedback throughout the project. Their guidance 
has been instrumental in shaping the project’s direction and improving its overall 
quality. 

I would  like to acknowledge  my colleagues and peers  who aided  in  interviews. 
Sharing  ideas,  and  collaborating  effectively  in  data  collection  fostered  a 
collaborative environment. Your contribution has enhanced the project and made it 
a collective achievement. 

Lastly, I appreciate the support from my family and friends who have been a constant 
source of encouragement and understanding during this academic journey. 
Thank you once again, everyone involved. Your support has been invaluable. And I 
am proud to have been part of such a collaborative and enriching project. 

Sincerely, 

Joyvender Awino.

#pagebreak()

= Abstract
_This project presents the  design and development of KWUST SmartHealth,  a 
web-­based  healthcare  management system aimed at digitizing and simplifying 
access to healthcare services  at  Kiriri  Women’s University of Science  and 
Technology (KWUST). The system addresses critical challenges faced by university 
health  centers,  including  manual  appointment  scheduling, fragmented  medical 
record ­keeping, lack  of  a  centralized  medicine  inventory, and limited patient 
engagement  with  their  own  health  data.  Leveraging  a  modern  technology  stack 
comprising Node.js, Express, EJS templating, and Directus as a headless CMS with 
a PostgreSQL backend, the platform delivers a responsive and intuitive interface 
with role-­based access for students, healthcare staff, and administrators. Students 
can  book appointments from staff ­defined time slots, view their  medical  history 
along with prescribed medicines, manage personal health notes and to-­do lists, and 
interact with an AI ­powered chatbot for general health inquiries. Staff can manage 
appointments,  create  medical  records  with  embedded  prescriptions,  oversee  the 
medicine inventory, and send reminders to students. The administrator dashboard 
provides user management, account verification, system audit logs, and oversight of 
medical  records  and  medicines. The  system  incorporates  a  full  PDF  generation 
service for printing medical records and prescriptions featuring the institutional logo 
and a generated timestamp. A dark mode toggle, comprehensive search and filtering 
across  all  data  tables,  and  a  Content  Security  Policy ­compliant frontend ensure 
usability, accessibility, and security. The AI chatbot integrates Google’s Gemini 2.0 
Flash  model  to  answer  general  health  questions  without  storing  chat  history, 
emphasizing  user  privacy.  By  consolidating  healthcare  workflows  into  a  single 
unified platform, KWUST SmartHealth reduces administrative overhead, improves 
data accuracy, enhances the patient experience, and fosters a more informed and 
health ­conscious university community._

#pagebreak()

#outline(title: [Table of contents], depth: 2, indent: auto)
#outline(title: [Table of Figures], target: figure.where(kind: image))
= List of Abbreviations
- *AI:* Artificial Intelligence
- *API:* Application Programming Interface
- *CMS:* Content Management System
- *CSP:* Content Security Policy
- *EHR:* Electronic Health Record
- *ICT:* Information and Communication Technology
- *JWT:* JSON Web Token
- *KWUST:* Kiriri Women’s University of Science and Technology
- *PDF:* Portable Document Format
- *RBAC:* Role-Based Access Control
- *REST:* Representational State Transfer
- *SUS:* System Usability Scale
- *TAM:* Technology Acceptance Model
- *UCD:* User-Centered Design
- *WHO:* World Health Organization

#set heading(numbering: "1.")
#set page(numbering: "1 of 1")
#counter(heading).update(0)
#pagebreak()
#counter(page).update(1)

= Chapter One: Introduction

== Background of the Study

#par[#text("Healthcare remains one of the most critical sectors in need of digital transformation worldwide (World Health Organization, 2021). Despite significant advances in medical science and health technology, many healthcare facilities in developing countries continue to rely on paper-based processes for core administrative and clinical functions, undermining the quality, efficiency, and accessibility of care. University health centers occupy a unique position in the healthcare landscape. In Kenya, the adoption of digital health systems in higher education institutions has been slow and uneven (Kruse et al., 2016).")]

=== Stakeholder Pain Points

#par[#text("During preliminary consultations conducted with students, healthcare staff, and administrators at KWUST, the limitations of the current manual system were clearly articulated across all stakeholder groups:")]

#table(
  columns: (1fr, 1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Stakeholder")]],
  [#strong[#text("Pain Points Expressed")]],
  [#strong[#text("Impact on Healthcare Experience")]],
  [#text("Students")],
  [#text("Long queues at health center; no way to book appointments remotely; inability to view medical history; no reminders for follow-up visits; frustrated by lost or misplaced records")],
  [#text("Reduced access to timely care; missed appointments; poor continuity of care; dissatisfaction with health services")],
  [#text("Healthcare Staff")],
  [#text("Heavy administrative burden from manual record-keeping; difficulty tracking patient follow-ups; time wasted searching for paper files; inability to monitor medicine stock levels efficiently; handwritten prescriptions easily lost or misinterpreted")],
  [#text("Reduced time available for direct patient care; increased stress and workload; potential for medication errors")],
  [#text("Administrators")],
  [#text("No visibility into health center operations and service utilization; inability to generate reports on common diagnoses or medicine usage patterns; no audit trail for accountability; difficulty verifying user identities and managing access")],
  [#text("Poor oversight of health center performance; challenges in resource planning and budget allocation; limited accountability measures")]
)

#par[#text("Table 2: Summary of Stakeholder Pain Points Identified During Preliminary Consultations at KWUST")]

=== The Digital Health Imperative

#par[#text("The global trajectory toward digital health transformation is well established. Extensive research has demonstrated the benefits of health information technology (HIT) in enhancing clinical efficiency, reducing medical errors, and improving patient outcomes (Buntin et al., 2011). Several studies have specifically examined the implementation of healthcare information systems in university settings.")]

=== Theoretical Foundations

#par[#text("This research is grounded in three complementary theoretical frameworks. First, the Information Systems Success Model, originally proposed by DeLone and McLean, posits that the success of an information system can be measured by six interdependent dimensions: system quality, information quality, service quality, user satisfaction, intention to use, and net benefits (Laudon & Laudon, 2020).")]

#table(
  columns: (1fr, 1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Area")]],
  [#strong[#text("Current Challenge (Manual)")]],
  [#strong[#text("Proposed ")]#strong[#text(" ")#text("Solution ")]#linebreak()#strong[#text("(")]#strong[#text("SmartHealth")]#strong[#text(")")]],
  [#text("Appointment Scheduling")],
  [#text("No visibility into slots; physical visits required; no cancellation option")],
  [#text("Online booking from predefined slots; view, cancel, reschedule anytime")#text(".")],
  [#text("Medical Records")],
  [#text("Paper files; prone to loss, damage, inaccessibility")],
  [#text("Digital records; instant retrieval; persistent storage")],
  [#text("Medicine Inventory")],
  [#text("Manual stock tracking; expiry unnoticed; stockouts")],
  [#text("Centralized tracking; search, filter, stock-level alerts")],
  [#text("Prescription Management")],
  [#text("Handwritten notes; easy to misplace")],
  [#text("Digital prescriptions linked to records; dosage, duration, instructions")],
  [#text("Patient Communication")],
  [#text("No appointment reminders; no health notifications")],
  [#text("Automated reminders; health alerts; AI chatbot for inquiries")],
  [#text("Patient Engagement")],
  [#text("No access to own medical history")],
  [#text("Patient portal with full medical and prescription history")]
)

#align(center)[#par[#text("Table 3: Summary of Challenges and Proposed Digital Solutions at KWUST Health Center")]]

== Problem Statement

#par[#text("The university health center at KWUST currently operates with entirely manual processes for appointment scheduling, medical record keeping, prescription management, and medicine inventory tracking. These manual workflows are inherently inefficient, error-prone, and unable to scale with the growing student population, which currently stands at several thousand students. In the area of appointment scheduling, students must physically visit the health center during operating hours to book consultations, with no ability to view available time slots in advance.")]

== Research Questions

#par[#text("Guided by the problem statement above, this research seeks to answer the following questions:")]

#table(
  columns: (1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Research Question")]],
  [#strong[#text("Description")]],
  [#text("1. Process Analysis")],
  [#text("What are the current manual healthcare processes used at the KWUST ")#text("University Health Center")#text(", and what specific inefficiencies and limitations do they introduce into healthcare delivery?")],
  [#text("2. System Design")],
  [#text("What architectural components, features, and security measures are required to design a secure and user-friendly healthcare management system for a university health center context?")],
  [#text("3. Implementation Feasibility")],
  [#text("How can a web-based healthcare management system be implemented using modern open-source technologies to meet the functional requirements of students, healthcare staff, and administrators?")],
  [#text("4. System Evaluation")],
  [#text("Does the developed system meet the defined functional and non-functional requirements, and how do end-users perceive its usability, reliability, and effectiveness?")],
  [#text("5. Appointment Optimization")],
  [#text("How can a role-based appointment scheduling system with predefined time slots improve access to care and reduce administrative overhead compared to manual booking?")]
)

#align(center)[#par[#text("Table 5: Research Questions Guiding the KWUST ")#text("SmartHealth")#text(" Development")]]

== Objectives

=== General Objective

#par[#text("To develop a web-based healthcare management system that digitizes and streamlines healthcare service delivery at KWUST, improving efficiency, accessibility, and quality of care for students, staff, and administrators.")]

=== Specific Objectives

- #text("To analyze the current manual healthcare processes used in the university clinic to identify inefficiencies and system requirements.")

- #text("To design a secure and user-friendly smart healthcare system that includes patient registration, appointment scheduling, electronic medical records, and communication features.")

- #text("To implement a web-based smart healthcare management system that supports patients, doctors, and administrators in managing healthcare services digitally.")

- #text("To test the developed system to ensure it meets functional and non-functional requirements such as accuracy, security, usability, and performance within the university clinic environment.")

- #text("To design and implement a role-based appointment scheduling system that allows students to book, view, and manage appointments from available time slots.")

=== Mapping of Objectives to Research Questions and Methodology

#par[#text("Each specific objective is linked to a corresponding research question and will be addressed through the methodology outlined in Chapter Three.")]

#table(
  columns: (1fr, 1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Objective")]],
  [#strong[#text("Research Question")]],
  [#strong[#text("Methodology")]],
  [#text("1. Analyze ")#text(" ")#text("current processes")],
  [#text("RQ1 — Process Analysis")],
  [#text("Stakeholder interviews, process observation, workflow documentation")],
  [#text("2. Design system architecture")],
  [#text("RQ2 — System Design")],
  [#text("UML modeling, use case diagrams, architecture design, security planning")],
  [#text("3. Implement the system")],
  [#text("RQ3 — Implementation")],
  [#text("Agile/Scrum development, Node.js, ")#text("Directus")#text(" CMS, PostgreSQL, iterative prototyping")],
  [#text("4. Test the system")],
  [#text("RQ4 — Evaluation")],
  [#text("Functional testing, usability testing (SUS), performance benchmarking, security testing")],
  [#text("5. Design appointment scheduling")],
  [#text("RQ5 — Optimization")],
  [#text("Slot-based scheduling algorithm design, database schema, frontend calendar UI")]
)

#align(center)[#par[#text("Table 6: Mapping of Specific Objectives to Research Questions and Methodology")]]

== Scope and Limitations

=== Scope

#par[#text("The study covers the design, development, and evaluation of a web-based healthcare management system for the KWUST university health center.")]

=== Limitations

#par[#text("The system is designed for KWUST and is not integrated with external laboratory or national health systems. It requires internet access, and its chatbot provides general information rather than diagnosis. Findings may not generalize to other institutions without further evaluation.")]

== Significance of the Study

#par[#text("The significance of this research extends across multiple dimensions, encompassing practical, theoretical, and policy contributions to the field of health information technology in developing-country university contexts.")]

=== Practical Significance

#par[#text("At the most immediate level, this research will deliver a functional, open-source healthcare management system that directly addresses the operational challenges faced by the KWUST university health center. Students will benefit from convenient online appointment booking, access to their medical records through a patient portal, automated health reminders, and reduced wait times.")]

=== Theoretical Significance

#par[#text("This research contributes to the growing body of knowledge on health information technology adoption in educational institutions. While extensive research has examined EHR implementation in large hospital settings (Jamoom et al., 2014; Menachemi & Collum, 2011), relatively few studies have focused on the specific context of university health centers, particularly in developing countries (Kruse et al., 2016).")]

=== Policy Significance

#par[#text("The COVID-19 pandemic underscored the critical importance of digital health infrastructure and contactless healthcare services (World Health Organization, 2021). The Kenyan government has identified digital health as a priority area in its national health strategy, yet progress in implementing health information systems in educational institutions has been slow (Kruse et al., 2016).")]

=== Comparison with Existing Solutions

#par[#text("Existing commercial healthcare management systems are often prohibitively expensive for small to medium-sized institutions like KWUST, with licensing fees, implementation costs, and ongoing maintenance expenses that can run into millions of shillings. They frequently lack the flexibility to adapt to the specific workflows of a university health center, requiring institutions to modify their processes to fit the software rather than the other way around.")]

== Target Audience

#par[#text("The KWUST SmartHealth system is designed for three primary user groups, each with distinct needs, responsibilities, and levels of system access.")]

=== Students

#par[#text("Students constitute the largest user group and are the primary beneficiaries of the system’s patient-facing features.")]

=== Healthcare Staff

#par[#text("Healthcare staff at the KWUST University Health Center are the primary clinical users of the system.")]

=== Administrators

#par[#text("Administrators oversee the governance and operation of the system. Their responsibilities include managing user accounts across all roles (creating, verifying, suspending, and deleting accounts), monitoring system activity through comprehensive audit logs, reviewing all medical records and medicine inventory across the health center, and generating reports and analytics for operational oversight.")]

== Organization of the Study

#par[#text("This research is organized into five chapters. Chapter One (the current chapter) provides the background, problem statement, objectives, research questions, scope, significance, and target audience for the study.")]

== Definition of Key Terms

#par[#text("An electronic health record (EHR) is a provider-maintained digital patient record. Role-based access control (RBAC) limits system actions by user role; a patient portal gives users access to their own health information; and an API enables communication between software systems.")]

#pagebreak()

= Chapter Two: Literature Review

== Introduction

#par[#text("The rapid advancement of information and communication technologies (ICT) has fundamentally transformed healthcare delivery across the globe. Electronic health records, online appointment scheduling, digital inventory management, telemedicine platforms, and AI-powered clinical decision support systems have become standard practice in many healthcare facilities, leading to measurable improvements in efficiency, reduction in medical errors, and enhanced patient satisfaction (Black et al., 2011; Buntin et al., 2011).")]

== Theoretical Framework

=== DeLone and McLean Information Systems Success Model

#par[#text("The DeLone and McLean model evaluates information systems through system, information, and service quality; use and user satisfaction; and net benefits (Laudon & Laudon, 2020).")]

=== Technology Acceptance Model

#par[#text("The Technology Acceptance Model explains user adoption through perceived usefulness and ease of use; these factors guide the design of an accessible system interface (Davis, 1989; Venkatesh et al., 2003).")]

=== User-Centered Design

#par[#text("User-centered design involves understanding users, defining requirements, developing solutions, and evaluating them with users (Irizarry et al., 2015). These principles support a clinic system shaped around the needs of students, staff, and administrators.")]

=== Health Informatics Theory

#par[#text("Health informatics sits at the intersection of information science, computer science, and healthcare, providing the theoretical foundation for developing and evaluating health information systems (Chaudhry et al., 2006). The discipline encompasses the acquisition, storage, retrieval, and use of health information to improve healthcare delivery.")]

== Electronic Health Record Systems

=== Overview and Evolution

#par[#text("Modern EHR systems store patient information and support clinical decisions, care coordination, and reporting (Menachemi & Collum, 2011).")]

=== Benefits of EHR Adoption

#par[#text("EHR systems can improve documentation, information access, patient safety, care coordination, and engagement; results depend on implementation and user adoption (Buntin et al., 2011; Menachemi & Collum, 2011).")]

#table(
  columns: (1fr, 1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Benefit")]],
  [#strong[#text("Example")]],
  [#strong[#text("Evidence")]],
  [#text("Clinical efficiency")],
  [#text("Less documentation time; faster information access")],
  [#text("High")],
  [#text("Patient safety")],
  [#text("Medication error reduction; allergy alerts")],
  [#text("High")],
  [#text("Care coordination")],
  [#text("Shared records; fewer duplicate tests")],
  [#text("High")],
  [#text("Patient engagement")],
  [#text("Portal access to records and appointments")],
  [#text("Medium")]
)

#align(center)[#par[#text("Table 12: Summary of Electronic Health Record Benefits")]]

=== Barriers to EHR Implementation

#par[#text("EHR adoption is constrained by cost, infrastructure, staff training, and implementation complexity, especially in resource-constrained settings (Kruse et al., 2016; Chaudhry et al., 2006).")]

=== EHR Systems in University Settings

#par[#text("The application of EHR systems in university health centers presents unique challenges and opportunities. University health centers serve a distinct population (predominantly young adults) with specific healthcare needs (preventive care, reproductive health, mental health services, and management of chronic conditions). Existing studies on EHR implementation in university settings are limited.")]

== Appointment Scheduling Systems

=== Overview of Digital Scheduling

#par[#text("Appointment scheduling is one of the most frequent and visible interactions between patients and healthcare providers. Traditional manual scheduling methods, including phone-based booking and walk-in queues, are associated with long wait times, high no-show rates, and poor patient satisfaction. Online appointment scheduling platforms such as Zocdoc and Practo have popularized digital booking in healthcare.")]

=== Scheduling Algorithms and Optimization

#par[#text("SmartHealth uses staff-defined appointment slots with set dates, times, and capacity limits. Students can book available appointments online, reducing reliance on walk-in scheduling.")]

=== Impact on Patient Satisfaction and No-Show Rates

#par[#text("Research consistently demonstrates that digital appointment scheduling has a positive impact on patient satisfaction and clinical efficiency (Irizarry et al., 2015). Web-based scheduling systems can reduce appointment-related phone calls, freeing staff to focus on clinical duties. No-show rates, which typically range from 15% to 30% in primary care settings, can be significantly reduced through digital scheduling with automated reminders (Irizarry et al., 2015).")]

== Medicine Inventory Management Systems

=== Inventory Management Principles in Healthcare

#par[#text("Medicine inventory management balances medicine availability against overstocking and expiry. Accurate stock records and timely reordering help limit waste (Volland et al., 2017).")]

=== ABC Analysis and Economic Order Quantity

#par[#text("Two fundamental techniques from inventory management theory are particularly relevant to medicine inventory systems: ABC Analysis categorizes inventory items based on their consumption value (annual consumption × unit cost). Economic Order Quantity (EOQ) provides a mathematical formula for determining the optimal order quantity that minimizes total inventory costs (ordering costs plus holding costs).")]

=== Digital Inventory Systems

#par[#text("Digital inventory systems track stock and expiry dates, improve ordering accuracy, reduce waste, and help prevent stockouts (Volland et al., 2017).")]

== AI and Chatbots in Healthcare

=== Evolution of Conversational AI in Healthcare

#par[#text("Artificial intelligence (AI) has emerged as a transformative force in healthcare, with applications spanning diagnostic imaging, drug discovery, personalized medicine, and clinical decision support (Shaw et al., 2019; Topol, 2019). Within this broader AI landscape, conversational AI in the form of chatbots and virtual assistants has gained particular traction for patient-facing applications (Yu et al., 2018).")]

=== Clinical Applications of Chatbots

#par[#text("Healthcare chatbots support health education, appointment management, and basic patient inquiries; studies report improved engagement but limited evidence on long-term clinical outcomes (Lee & Yoon, 2021; Yu et al., 2018).")]

=== Large Language Models and Healthcare

#par[#text("The recent emergence of large language models (LLMs) such as GPT-4, Google’s Gemini, and Claude has opened new possibilities for healthcare chatbots (Yu et al., 2018). Unlike earlier chatbot approaches that required extensive manual curation of response libraries, LLMs can generate contextually appropriate responses across a wide range of health topics by leveraging vast training corpora of medical literature, clinical guidelines, and health information.")]

== Patient Portals and Personal Health Records

=== Patient Engagement Through Digital Portals

#par[#text("Patient portals are secure web-based or mobile applications that allow patients to access their health information, communicate with healthcare providers, and manage aspects of their care digitally (Anderson & Agarwal, 2011; Irizarry et al., 2015). The concept of patient portals emerged from the broader movement toward patient-centered care and shared decision-making, recognizing that informed and engaged patients achieve better health outcomes.")]

=== Features and Impact of Patient Portals

#par[#text("Patient portals can provide access to medical records, secure communication, appointment management, medication information, and health education (Irizarry et al., 2015).")]

=== Adoption Factors and Challenges

#par[#text("Portal adoption is affected by usability, digital literacy, access, and privacy concerns (Irizarry et al., 2015). SmartHealth addresses usability with a responsive interface, role-based views, and staff-verified registration.")]

== Security and Privacy in Health Information Systems

=== Regulatory Frameworks

#par[#text("Health information requires strong privacy safeguards. Although HIPAA and GDPR do not directly govern KWUST, their principles provide useful guidance for protecting personal data (Bates & Gawande, 2003).")]

=== Technical Security Measures

#par[#text("Protect sensitive records with role-based access, secure authentication, protected data transmission, and audit logging (Bates & Gawande, 2003).")]

=== Privacy Concerns and Trust

#par[#text("Patient trust is essential for the successful adoption of health information systems. Studies have shown that privacy concerns are among the most significant barriers to patient portal adoption and health data sharing (Anderson & Agarwal, 2011; Irizarry et al., 2015).")]

== Comparison of Existing Approaches

#par[#text("Enterprise EHRs offer broad clinical functionality but can be costly and complex for university clinics. Smaller clinic systems are easier to deploy but may lack integrated scheduling, records, inventory, and patient access. SmartHealth combines these functions for KWUST (Menachemi & Collum, 2011).")]

== Gaps Identified

#par[#text("Based on the comprehensive review of existing literature and systems presented in this chapter, several significant gaps have been identified:")]

== How This Project Addresses the Gaps

#par[#text("SmartHealth addresses these gaps by integrating appointments, medical records, prescriptions, inventory, patient access, and administration. Its three-tier architecture uses an EJS interface, a Node.js/Express application layer, and Directus with PostgreSQL for data services; Gemini supports general health inquiries.")]

#table(
  columns: (1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Gap Identified")]],
  [#strong[#text("How ")]#strong[#text("SmartHealth")]#strong[#text(" Addresses It")]],
  [#text("Lack of Integrated Solutions")],
  [#text("Single, unified platform combining appointment scheduling, electronic medical records, prescription management, medicine inventory tracking, AI chatbot, patient portal, and administrative dashboard. All modules share a common database and authentication system, ensuring data consistency and eliminating silos.")],
  [#text("Prohibitive Cost and Complexity")],
  [#text("Open-source technology stack (Node.js, Express, ")#text("Directus")#text(" CMS, PostgreSQL) (Monospace Inc., 2024) eliminates licensing costs. Modular architecture allows phased deployment. Low infrastructure requirements enable deployment on affordable cloud or on-premises servers. Estimated total deployment cost is a fraction of enterprise EHR alternatives.")],
  [#text("Limited AI Integration")],
  [#text("Integration with Google’s Gemini API (Google LLC, 2024) provides a generative AI chatbot capable of answering general health inquiries. Features include rate limit handling, ")#text("privacy-preserving")#text(" no-history-storage design, and clear disclaimers about AI limitations. The chatbot is accessible via a floating widget across all system pages.")],
  [#text("Insufficient Patient Engagement")],
  [#text("Comprehensive patient portal providing students with access to full medical history, prescribed medicines with dosage details, appointment management (book, view, cancel, reschedule), and health reminders. Designed with user-centered principles and responsive layout for mobile access (Irizarry et al., 2015).")],
  [#text("Inadequate Administrative Oversight")],
  [#text("Dedicated admin dashboard with user management (create, verify, suspend, delete accounts across all roles), audit logs documenting all user actions with timestamps and user IDs, medical records overview across all patients, and medicines overview with stock level and expiry monitoring.")],
  [#text("Scalability and Flexibility Constraints")],
  [#text("PostgreSQL backend provides robust data management for growing datasets. Stateless Node.js API supports horizontal scaling by adding application server instances. ")#text("Directus")#text(" headless CMS enables flexible content modeling without code changes, allowing the system to adapt to evolving requirements. Modular architecture allows individual components to be updated or replaced independently.")],
  [#text("Lack of Focus on University Health Centers")],
  [#text("System designed specifically for university health center workflows based on consultations with KWUST students and staff. Features tailored to the student population (role-based access, academic calendar considerations) and institutional context (campus-based deployment, integration with university systems).")]
)

#align(center)[#par[#text("Table 20: Mapping of Identified Gaps to Proposed KWUST ")#text("SmartHealth")#text(" Solutions")]]

*HTTP (JWT Auth)*

#par[#text("Node.js / Express Server Routing · Auth · RBAC · Session · PDFKit · Chatbot Proxy")]

*REST API (Static Token)*

#par[#text("Directus Headless CMS Data API · File Uploads · Auth · Admin UI")]

*SQL*

#par[#text("PostgreSQL Users · Appointments · Records · Prescriptions · Medicines · Audit Logs")]

== Summary

#par[#text("This chapter has provided a comprehensive review of literature and existing systems related to healthcare management, with a specific focus on the university health center context. The theoretical framework grounding this research encompasses the DeLone and McLean IS Success Model for evaluating system effectiveness, the Technology Acceptance Model for understanding user adoption, user-centered design principles for guiding development, and health informatics theory for ensuring clinical relevance. The emerging field of AI in healthcare, particularly conversational AI, offers new opportunities for patient engagement and health education.")]

#pagebreak()

= Chapter Three: Methodology

== Introduction

#par[#text("This chapter describes the technical approach and development methodology for implementing the proposed KWUST SmartHealth system. The chapter is organized as follows: Section 3.2 presents the overall system architecture.")]

== System Architecture

#par[#text("The system follows a three-tier client-server architecture with three primary layers communicating via RESTful APIs and a headless CMS. The architecture is designed to be modular, scalable, and secure.")]

=== High-Level Architecture Diagram

#par[#text("System flow: browser requests pass through Node.js and Directus to PostgreSQL; the chatbot sends general questions to Gemini.")]

#table(
  columns: (1fr, 3fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Flow")]],
  [#strong[#text("Editable sequence")]],
  [#text("System components")],
  [#text("Browser → Node.js → Directus → PostgreSQL; Gemini is the external AI service.")],
  [#text("Standard Request Flow")],
  [#text("Browser — HTTP (GET/POST), JWT Auth → Node.js — REST API, Static Token → Directus — SQL Query → PostgreSQL — Result Set → Directus — JSON Response → Node.js — HTTP Response → Browser.")],
  [#text("AI Chatbot Flow")],
  [#text("Browser → Node.js — HTTPS POST, API Key → Gemini — AI Response → Node.js → Browser.")],
)

=== Component Descriptions

#table(
  columns: (1fr, 1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Component")]],
  [#strong[#text("Role")]],
  [#strong[#text("Deployment")]],
  [#text("Browser (Student, Staff, Admin)")],
  [#text("Renders EJS templates; handles client-side interactions; manages local state")],
  [#text("Any modern web browser ")#linebreak()#text("(Chrome, Firefox, Safari)")],
  [#text("Node.js / Express Server")],
  [#text("Routes HTTP requests; manages sessions; enforces ")#text("role-based")#text(" access; generates PDFs")],
  [#text("Cloud or on-premises server (Node.js runtime)")],
  [#text("Directus")#text(" Headless CMS")],
  [#text("Provides RESTful API for database operations; manages file uploads; handles authentication")],
  [#text("Same or separate server as Node.js")],
  [#text("PostgreSQL Database")],
  [#text("Stores users, appointments, medical records, prescriptions, medicines, ")#text("and ")#text("audit logs")],
  [#text("Database server (managed or self-hosted)")],
  [#text("Gemini API (External)")],
  [#text("AI chatbot service for health inquiries")],
  [#text("Google Cloud (external API)")]
)

#align(center)[#par[#text("Table 21: System Components and Their Roles")]]

=== Data Flow (Appointment Booking)

#par[#text("A student selects an available slot and submits a booking. The server checks availability, saves the appointment through Directus to PostgreSQL, and returns a confirmation to the student.")]

== Technology Stack

=== Backend Technologies

#par[#text("Node.js and Express handle server routes, sessions, and access control. PDFKit generates medical documents, and an HTTP client connects to the Gemini API.")]

=== Frontend Technologies

#par[#text("The interface uses EJS, HTML, CSS, and JavaScript for page rendering, responsive layouts, and client-side interactions. Chart.js supports dashboard analytics.")]

=== Database and CMS

#par[#text("Directus provides the REST API and administration interface; PostgreSQL stores users, appointments, medical records, prescriptions, medicines, and audit logs.")]

== Development Methodology

=== Approach: Agile (Scrum)

#par[#text("The project uses Agile Scrum with two-week sprints, allowing requirements and features to be refined through regular reviews and testing.")]

=== Sprint Structure (6 sprints, 12 weeks total)

#table(
  columns: (1fr, 1fr, 1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Sprint")]],
  [#strong[#text("Weeks")]],
  [#strong[#text("Activities")]],
  [#strong[#text("Deliverable")]],
  [#text("Sprint 0")],
  [#text("Week 0")],
  [#text("Environment setup: install Node.js, Directus, PostgreSQL; configure project structure; set up version control")],
  [#text("Working development environment with ")#text("Directus")#text(" and PostgreSQL connected")],
  [#text("Sprint 1")],
  [#text("Weeks 1–2")],
  [#text("User authentication: registration, login, role-based access (student, staff, admin); ")#linebreak()#text("database schema de-")#linebreak()#text("sign for users and roles")],
  [#text("Login and registration working for all three roles")],
  [#text("Sprint 2")],
  [#text("Weeks 3–4")],
  [#text("Appointment scheduling: staff defines time slots; student books, views, cancels appointments; calendar UI")],
  [#text("Functional appointment booking flow")],
  [#text("Sprint 3")],
  [#text("Weeks 5–6")],
  [#text("Medical records module: staff creates records with diagnoses")#text(" and")#text(" prescriptions; patient portal to view history; medicine inventory CRUD")],
  [#text("Medical records and inventory ")#text(" ")#text("management working")],
  [#text("Sprint 4")],
  [#text("Weeks 7–8")],
  [#text("PDF generation service; AI chatbot integration with Gemini API; admin dashboard with user management")],
  [#text("PDF download, chatbot, and admin panel functional")],
  [#text("Sprint 5")],
  [#text("Weeks 9–10")],
  [#text("Full integration testing; dark mode; re-")#linebreak()#text("sponsive")#text(" design polish; reminder notifications; search and filtering")],
  [#text("Complete system with all features integrated")],
  [#text("Sprint 6")],
  [#text("Weeks 11–12")],
  [#text("User acceptance testing; performance benchmarking; bug fixes; documentation")],
  [#text("Final deliverable with metrics report")]
)

#align(center)[#par[#text("Table 25: Sprint Plan for KWUST ")#text("SmartHealth")#text(" Development")]]

=== Daily and Weekly Practices

#par[#text("The team holds brief daily stand-ups, reviews working features weekly, and runs a retrospective at the end of each sprint. Git is used for version control.")]

== Key Modules and Functionalities

=== Module 1: User Management and Authentication

#table(
  columns: (1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Function")]],
  [#strong[#text("Description")]],
  [#text("Staff defines time slots")#text(".")],
  [#text("Staff creates available appointment slots with date, start time, end time, and maximum patients per slot")#text(".")],
  [#text("Student books appointment")],
  [#text("Student views available slots, selects a time, and confirms booking")#text(".")],
  [#text("View appointments")],
  [#text("Students see their upcoming and past appointments; staff see all appointments for their slots")#text(".")],
  [#text("Cancel/reschedule")],
  [#text("Students")#text(" can cancel a booking; staff can mark appointments as completed or cancelled")#text(".")],
  [#text("Appointment reminders")],
  [#text("System displays reminders on dashboard for upcoming appointments; future SMS/email integration")#text(".")]
)

#align(center)[#par[#text("Table 27: Appointment Scheduling Module Functions")]]

=== Module 3: Medical Records and Prescriptions

#par[#text("Staff create visit records with diagnoses, notes, and prescriptions. Students can view their medical history, while staff can search records and export them as PDFs.")]

=== Module 4: Medicine Inventory Management

#par[#text("Staff maintain medicine names, categories, quantities, and expiry dates. Stock updates when medicines are prescribed, and low-stock levels can be monitored.")]

=== Module 5: AI Chatbot

#par[#text("The chatbot uses Gemini for general health questions. It does not retain chat history and displays a notice that it does not replace professional medical advice.")]

=== Module 6: Admin Dashboard and Reporting

#table(
  columns: (1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Function")]],
  [#strong[#text("Description")]],
  [#text("User management")],
  [#text("View, verify, suspend, or delete user accounts across all roles")#text(".")],
  [#text("Audit logs")],
  [#text("System logs showing user actions (login, record creation, appointment changes) for accountability")#text(".")],
  [#text("Medical records overview")],
  [#text("View all medical records across patients; filter by staff, date, or diagnosis")#text(".")],
  [#text("Medicines overview")],
  [#text("View all medicines; monitor stock levels and expiry dates across the entire inventory")#text(".")]
)

#align(center)[#par[#text("Table 31: Admin Dashboard Module Functions")]]

== PDF Generation Pipeline

=== Overview

#par[#text("The PDF generation pipeline enables printing of medical records and prescriptions. It uses the PDFKit library in Node.js to produce documents styled with the institutional brand.")]

=== Phase 1: Document Initialization

#par[#text("PDF exports use A4 pages with an institutional header, generation timestamp, and formatted medical record or prescription content.")]

=== Phase 2: Content Generation

#par[#text("For medical records, the pipeline writes patient details (name, date, staff), then iterates over diagnoses, symptoms, notes, and prescribed medicines. For prescriptions, it creates a focused document listing only the medicines with dosage, duration, and instructions.")]

=== Phase 3: Output

#par[#text("The server streams the generated PDF to the browser with a suitable filename and content type. The document includes the relevant visit details and prescribed medicines.")]

== Evaluation Metrics and Testing

=== Performance Metrics

#table(
  columns: (1fr, 1fr, 1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Metric")]],
  [#strong[#text("Target")]],
  [#strong[#text("Measurement Method")]],
  [#strong[#text("Test Environment")]],
  [#text("Page load time (dashboard)")],
  [#text("< 2 seconds")],
  [#text("Chrome DevTools Network tab — ")#text("DOMContentLoaded")#text(" time")],
  [#text("5 loads, averaged across different user roles")],
  [#text("Appointment booking time")],
  [#text("< 3 seconds")],
  [#text("Time from clicking “Book” to confirmation displayed")],
  [#text("20 booking attempts, averaged")],
  [#text("PDF generation time")],
  [#text("< 5 seconds")],
  [#text("Time from clicking “Download” to file receipt")],
  [#text("15 generations (mix of records and prescriptions)")],
  [#text("Chatbot response time")],
  [#text("< 5 seconds")],
  [#text("Time from sending message to receiving bot reply")],
  [#text("20 queries (including ")#linebreak()#text("Gemini API latency)")],
  [#text("Search response time")],
  [#text("< 2 seconds")],
  [#text("Time from typing search term to results displayed")],
  [#text("20 searches across different modules")],
  [#text("API endpoint latency")],
  [#text("< 500 ")#text("ms")],
  [#text("Server-side logging of request-to-response duration")],
  [#text("50 requests across all major endpoints")],
  [#text("System uptime")],
  [#text("> 99%")],
  [#text("Monitor during testing period")],
  [#text("Continuous monitoring during 2-week test period")]
)

#align(center)[#par[#text("Table 35: Performance Metrics and Targets")]]

=== Testing Procedures

==== Functional Testing (All Objectives)

- #text("Setup: Deployed system with test data (20 sample students, 3 staff, 1 admin, 30 medicines, 50 appointments).")

- #text("Procedure: Execute each user story (appointment booking, record creation, prescription, inventory update, chatbot query, PDF download, admin verification).")

- #text("Success criteria: All user stories pass without errors.")

==== Test 2: Usability Testing (Objective 8)

- #text("Setup: 10 volunteer participants (5 students, 3 staff, 2 administrators).")

- #text("Tasks: Book an appointment, view medical history, create a medical record (staff), add a medicine (staff), download a PDF, ask the chatbot a question.")

- #text("Measurement: Task completion rate, time per task, number of errors.")

- #text("Survey: System Usability Scale (SUS) questionnaire after testing.")

==== Test 3: Security Testing

#par[#text("Test role boundaries, protected routes, input handling, and token expiry. Unauthorized access should be rejected and invalid input should not compromise records.")]

==== Test 4: Responsive Design and Cross-Browser Testing

#par[#text("Check core pages, forms, and tables in supported browsers and desktop and mobile layouts; verify that functionality remains usable at each size.")]

=== Pass/Fail Criteria

#par[#text("The project will be considered successful if:")]

#table(
  columns: (1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Criterion")]],
  [#strong[#text("Threshold")]],
  [#text("All core features functional (appointments, records, inventory, chatbot, PDF, admin)")],
  [#text("100%")],
  [#text("Page load time")],
  [#text("< 2 seconds (mean)")],
  [#text("PDF generation time")],
  [#text("< 5 seconds (mean)")],
  [#text("Chatbot response time")],
  [#text("< 5 seconds (mean)")],
  [#text("Usability (SUS score)")],
  [#text("> 70 / 100")],
  [#text("Task completion rate")],
  [#text("> 90%")],
  [#text("Unauthorized access blocked")],
  [#text("100% of attempts rejected")],
  [#text("No unrecoverable crashes")],
  [#text("0 critical bugs")]
)

#align(center)[#par[#text("Table 36: Pass/Fail Criteria for Project Success")]]

== Ethical Considerations

=== Data Privacy and Security

#par[#text("Health data is sensitive and requires special protection. The system implements the following measures:")]

#table(
  columns: (1fr, 1fr),
  inset: 5pt,
  stroke: 0.5pt,
  align: top,
  [#strong[#text("Measure")]],
  [#strong[#text("Implementation")]],
  [#text("Authentication")],
  [#text("JWT-based authentication with role-based access control; passwords hashed with ")#text("bcrypt")],
  [#text("Authorization")],
  [#text("Middleware-enforced role checks on all routes; students cannot access staff/admin endpoints")],
  [#text("Data encryption in transit")],
  [#text("HTTPS for all client-server communication; API calls over TLS")],
  [#text("Data encryption at rest")],
  [#text("PostgreSQL connection encryption; ")#text("database-level")#text(" access controls")],
  [#text("Session management")],
  [#text("Token expiry after configurable period; secure HTTP-only cookies where applicable")],
  [#text("Audit logging")],
  [#text("All user actions logged with timestamp, user ID, and action type for accountability")#text(".")],
  [#text("Input sanitization")],
  [#text("Content Security Policy (CSP) headers to prevent XSS attacks; input validation on all forms")]
)

#align(center)[#par[#text("Table 37: Data Privacy and Security Measures")]]

=== User Consent and Transparency

#par[#text("Users are informed about data collection and can access their own health records. The chatbot is identified as informational and does not store chat history.")]

=== Accessibility and Fairness

#par[#text("The responsive interface and role-based views support different devices, technical abilities, and user responsibilities.")]

== Summary

#par[#text("This chapter presented the methodology for developing the KWUST SmartHealth healthcare management system. The system uses a three-tier web architecture with Node.js and Express on the application layer, Directus as a headless CMS, and PostgreSQL as the database.")]

#pagebreak()

#bibliography(
  "references.bib",
  title: [References],
  style: "american-psychological-association",
  full: true,
)
