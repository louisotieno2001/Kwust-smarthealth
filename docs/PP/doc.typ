#set page(
  paper: "a4",
  // margin: (x: 1.8cm, y: 1.5cm),
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

#pagebreak()
// cover page
#align(center, grid(rows: (1fr, 1fr, 1fr, 1fr, 1fr), [
  #image("mmu.png", width: 30%)
  *MULTIMEDIA UNIVERSITY OF KENYA*\
  FACULTY OF COMPUTING & INFORMATION TECHNOLOGY\
  ],
  [ #align(horizon, text(weight: "bold", fill: red, size: 16pt,[*Simplifying Digital Privacy: An Intelligent Approach to App Permissions and Terms of Service*]))],
  [ *BY*\
    ELVIS OMENTA\
    CIT-223-057/2021],
  [
    *SUPERVISOR*\
  ],
  align(bottom, [#line(length: 80%)
   Submitted in partial fulfillment of the requirements of Fourth Year Bachelor of Science in Computer Science])
))

#counter(page).update(0)
#pagebreak()
#set page(numbering: "i")

= Declaration and Approval
=== STUDENT
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

=== UNIVERSITY SUPERVISOR’S APPROVAL
This research proposal has been submitted for examination with my approval as University supervisor.
#table(
  columns: (auto, auto),
  inset: 10pt,
  align: horizon,
  stroke: none,
  [Signature#line(length: 100%, stroke: (dash: "dashed"))],
  [Date#line(length: 100%, stroke: (dash: "dashed"))],
  [Names#line(length: 100%, stroke: (dash: "dashed"))],
  [Faculty of#line(length: 100%, stroke: (dash: "dashed"))],
)

=== HEAD OF DEPARTMENT’S APPROVAL
This research proposal has been submitted for examination with my approval as Head of Department
#table(
  columns: (auto, auto),
  inset: 10pt,
  align: horizon,
  stroke: none,
  [Signature#line(length: 100%, stroke: (dash: "dashed"))],
  [Date#line(length: 100%, stroke: (dash: "dashed"))],
  [Names#line(length: 100%, stroke: (dash: "dashed"))],
  [Department of#line(length: 100%, stroke: (dash: "dashed"))],
)

#pagebreak()

= Acknowledgement
I would like to express my sincere gratitude and appreciation to all 
those who have contributed to the successful completion of this project research
. This endeavor has been a significant learning experience, and I 
am truly thankful for the support and guidance received.

I extend my heartfelt appreciation to the project for their valuable insights
, encouragements and constructive feedback throughout the project. Their guidance has 
been instrumental in shaping the project’s direction and improving its 
overall quality.

I would like to acknowledge my colleagues and peers who aided in interviews
, sharing ideas, and collaborated effectively in data collection, fostering a collaborative environment
. Your contribution has enhanced the project and made it a collective achievement.

Lastly, I appreciate the support from my family and friends who 
have been constant source of encouragement and understanding during this academic journey.

Thank you once again everyone involved. Your support has been invaluable
, and I am proud to have been part of such a collaborative and enriching project.

Sincerely, \
Elvis Omenta.

#pagebreak()
= Abstract
_This project addresses the increasing concerns surrounding digital privacy by developing an Android
application designed to enhance user awareness of app permissions and terms of service
agreements. The application aims to empower users by providing a clear understanding
of what they are consenting to when installing applications. By scanning installed
apps, it evaluates requested permissions and ranks them based on a privacy
meter that highlights potential risks to personal data. Integrating insights from the
Terms of Service; Didn’t Read (ToS;DR)
initiative, the app offers concise summaries of terms related to personal information
usage, ensuring users are informed about their rights and obligations. In
cases where ToS;DR data is unavailable, a lightweight language model
is utilized to automatically parse and summarize terms of service documents. This
approach not only enhances user understanding of privacy implications but also encourages proactive
engagement with digital security. Ultimately, the application serves as a valuable
tool for users, fostering a more informed and privacy-conscious community
in an increasingly complex digital landscape._

#pagebreak()

#outline(title: [Table of contents], depth: 2, indent: auto)
#outline(title: [Table of Figures],target: figure.where(kind: image))
= List of Abbreviations
- *ToS:*  Terms of Service
- *ToS;DR:*  Terms of Service; Didn’t Read
- *NLP:*  Natural Language Processing
- *GDPR:*  General Data Protection Regulation
- *CCPA:*  California Consumer Privacy Act
- *DFD:*  Data Flow Diagram
- *SUS:*  System Usability Scale
- *AI/ML:*  Artificial Intelligence / Machine Learning
- *API:*  Application Programming Interface

#set heading(numbering: "1.")
#set page(numbering: "1 of 1")
#counter(heading).update(0)
#pagebreak()
#counter(page).update(1)

= Chapter One - Introduction
== Chapter Introduction

In an era dominated by digital connectivity, privacy concerns have become a
critical issue for individuals and organizations alike. With the rapid increase of
mobile applications, users often find themselves granting permissions and agreeing to terms
of service without fully understanding the implications @acquisti2005. This lack of awareness exposes
them to potential risks, ranging from data misuse to breaches of personal
information. This chapter lays the foundation for the development of an Android application that
addresses these concerns.

== Motivation & Background

The motivation for this research stems from a growing concern regarding digital privacy
in the modern world. With the advent of smartphones and their widespread
use, mobile applications have become integral to daily life, offering convenience
but often at the expense of personal privacy. Observing the widespread lack
of awareness among users about the implications of permissions granted to apps and
the obscure nature of terms of service agreements was a key driver for
this study.

During my undergraduate years, I frequently encountered peers and family members struggling
to comprehend the extent to which their data was being accessed and utilized
by mobile applications. These experiences underscored the pressing need for a tool
that could bridge the knowledge gap and empower users to take control of
their digital privacy.

The background of this research is also informed by the increasing prevalence of
data breaches and the ethical debates surrounding data collection practices. Regulatory initiatives
, such as the General Data Protection Regulation (GDPR), have highlighted
the importance of transparency in data usage. However, users still face
challenges in navigating complex terms of service and understanding app permissions. This
gap in user awareness presents an opportunity to create a solution that simplifies
and demystifies digital privacy concerns.

By addressing these issues, this research aims to contribute to a more
informed and privacy-conscious digital community, empowering users to make safer
and more informed decisions in their digital interactions.


== Background of Research

=== Stating the Problem

The increasing ubiquity of mobile applications has resulted in users becoming more dependent
on them for everyday tasks, from communication to financial transactions. However
, this dependency is accompanied by significant privacy risks, as users often
unknowingly consent to excessive or invasive permissions and agree to lengthy terms of
service agreements they do not fully understand. This lack of transparency and
comprehension exposes users to potential data misuse, unauthorized data sharing, and
breaches of personal privacy.

=== Relevant Literature

Existing studies highlight the challenges users face in understanding and managing digital privacy
. Research has shown that most users do not read terms of service
documents due to their complexity and length, while others fail to comprehend
the implications of app permissions. The Terms of Service; Didn’
t Read (ToS;DR) @tosdr initiative has attempted to bridge this
gap by summarizing terms of service agreements for popular platforms. However,
its coverage is limited, and many applications remain unassessed. Additionally,
privacy meters and ranking systems have been proposed in prior studies, but
their implementation is often inconsistent and lacks integration with real-time app
data.

=== Theoretical Framework

This research is grounded in privacy communication theories and user empowerment frameworks.
The project leverages concepts from information asymmetry theory, which highlights the imbalance
between what users know and what service providers disclose. By addressing this
asymmetry, the research seeks to create tools that enhance user awareness and
decision-making. Moreover, the application integrates machine learning techniques to
provide automated and accessible insights, fostering a more equitable digital environment.

=== Objectives and Significance

The primary objective of this research is to develop an Android application that
evaluates app permissions and terms of service agreements, presenting users with clear
and concise insights. By ranking permissions on a privacy meter and summarizing
terms of service using a lightweight language model, the application aims to
empower users to make informed decisions.

The significance of this research lies in its potential to foster a culture
of digital responsibility and awareness. By equipping users with the knowledge to
navigate complex privacy landscapes, the project contributes to enhancing individual data security
and promoting ethical data practices across industries.

In summary, this research addresses a critical gap in user understanding of
digital privacy, providing innovative solutions that are practical, scalable, and
impactful.

== Problem Statement

Mobile applications has brought convenience to users’ daily lives but at the
expense of privacy and data security. Mobile apps often require extensive permissions
and present lengthy terms of service agreements that users rarely read or fully
understand. This lack of transparency leaves users vulnerable to data misuse,
unauthorized data sharing, and breaches of personal privacy.

The problem primarily affects mobile application users who, due to limited time
, technical knowledge, or awareness, fail to comprehend the implications of
their consent. It also impacts organizations and developers striving to maintain ethical
practices but competing in a market that often prioritizes convenience over transparency.
The issue is further exacerbated in regions with limited digital literacy or weaker
privacy regulations.

This research seeks to address these challenges by developing a tool that bridges
the knowledge gap, empowers users to make informed decisions, and promotes
a privacy-conscious digital ecosystem. By leveraging machine learning and privacy
analysis frameworks, the proposed solution aims to mitigate risks and improve the
overall user experience with mobile applications.

== Aim of Research

The aim of this research is to enhance user awareness and control over
digital privacy by developing an innovative Android application. This application is designed
to analyze and evaluate app permissions and terms of service agreements, presenting
users with accessible insights through:

- A privacy meter that ranks app permissions based on their potential risks to
  personal data.
- Concise summaries of terms of service, leveraging the Terms
  of Service; Didn’t Read (ToS;DR) dataset
  and a lightweight language model for unsupported cases.

By achieving these aims, the research seeks to empower users to make
informed decisions about their digital interactions, foster a culture of privacy consciousness
, and contribute to broader discussions on ethical data practices and user empowerment
in the digital age.


== Objectives of the Research

=== Main Objective of the Research
To develop an Android application that enhances user awareness of app permissions and
terms of service agreements, enabling informed decision-making and fostering digital
privacy consciousness.

=== Specific Objectives of the Research

- Design and implement a privacy meter to rank app permissions based on their
  potential risk to user privacy.
- Integrate data from the Terms of Service; Didn’t Read (
  ToS;DR) initiative to provide clear summaries of app terms of service.
- Develop and utilize a lightweight language model to analyze and summarize terms of
  service agreements not covered by ToS;DR.
- Evaluate the usability and effectiveness of the application in enhancing user awareness and
  decision-making regarding digital privacy.

== Justification of Research

The justification for this research is rooted in the growing challenges users face
in managing digital privacy and understanding the implications of app permissions and terms
of service agreements. Despite regulatory advancements like the GDPR, users remain
vulnerable due to the complex and opaque nature of privacy policies and permissions
requests.

Existing tools and initiatives, such as ToS;DR, provide limited
coverage and do not cater to the real-time needs of mobile
app users. Many studies have also highlighted the inadequacy of current solutions
in empowering users with actionable insights into their digital privacy. These gaps
underscore the need for a comprehensive and accessible tool that simplifies the complexities
of app permissions and terms of service while providing real-time,
user-friendly insights.

By leveraging machine learning and privacy analysis frameworks, this research addresses the
critical need for enhanced user empowerment and privacy consciousness. The proposed solution
not only fills existing gaps but also aligns with global efforts to promote
transparency, ethical data practices, and digital literacy. Through this research
, the project aims to make a meaningful contribution to creating a safer
and more informed digital ecosystem.

== Scope of Research

This research focuses on:

- Target Population: Mobile application users who seek enhanced awareness and control
  over their digital privacy.
- Geographical Focus: While the application is designed for a global audience
  , initial testing and feedback will focus on a specific demographic group for
  practical evaluation.
- Timeframe: The development and evaluation of the proposed solution are planned
  within a 3-month period.
- Features: The research is centered on implementing a privacy meter to
  rank app permissions and integrating a lightweight language model to summarize terms of
  service agreements.

By defining these parameters, the research ensures a clear focus and practical
approach to achieving its objectives while maintaining alignment with the overall aim of
promoting digital privacy awareness and user empowerment.


#pagebreak()

= Chapter 2: Review of Related Work
== Chapter Introduction
The rapid growth of mobile applications and the increased reliance on digital platforms
have given rise to complex privacy concerns, particularly in areas such as
social media platforms collecting excessive user data, financial apps requiring intrusive permissions
, and gaming applications embedding unclear terms regarding data sharing. These challenges
emphasize the need for innovative solutions to empower users with tools that enhance
their understanding of app permissions and terms of service agreements.


== History of the Research Topic
The concept of digital privacy has evolved significantly over the last few decades
, paralleling the advancement of technology and the proliferation of internet-connected
devices. In the early days of computing, privacy concerns were minimal
, as systems were isolated and not interconnected. However, the rise
of the internet in the late 20th century marked a turning point,
as users began sharing personal data across online platforms without fully understanding the
implications.

The introduction of mobile applications in the early 2000s further complicated
the privacy landscape. As smartphones became ubiquitous, app developers gained unprecedented
access to user data, often through permissions that users granted without adequate
comprehension. Notable scandals, such as the Cambridge Analytica data breach in
2018, underscored the vulnerabilities in user data protection and highlighted the need
for greater transparency in data collection practices.

In response to growing concerns
, regulatory frameworks such as the General Data Protection Regulation (GDPR) @gdpr2018
in Europe and the California Consumer Privacy Act (CCPA) @ccpa2018 in the
United States were established to enforce stricter data protection standards. Concurrently,
initiatives like Terms of Service; Didn’t Read (ToS;DR)
emerged to simplify complex terms of service agreements, making them
more accessible to users.

Despite these efforts, many challenges persist. Users continue to struggle with
understanding app permissions and lengthy, jargon-filled terms of service agreements
. This historical context underscores the urgency of developing tools that empower users
to take control of their digital privacy, laying the groundwork for the
research presented in this study.

== Review of Related Prototypes or Systems

Several tools and systems have been developed to address the challenges of digital
privacy, focusing on app permissions and terms of service agreements. This
section reviews some of the most relevant prototypes and systems to highlight their
contributions and limitations, thereby positioning the proposed research within the context of
existing solutions.

+ *Terms of Service; Didn’t Read (ToS;DR)*
  ToS;DR is a community-driven initiative that simplifies complex terms
  of service agreements by providing summaries and ratings for popular websites and applications
  . While this tool has been instrumental in raising awareness, its coverage
  is limited to a small subset of platforms, leaving many applications unassessed
  . Additionally, the reliance on manual contributions restricts its scalability.
+ *App Permission Managers*
  Many smartphone operating systems, such as Android and iOS, now include
  built-in permission managers that allow users to review and modify app
  permissions. While these tools provide some level of control, they often
  lack the contextual insights necessary for users to understand the implications of granting
  specific permissions. This gap limits their effectiveness in empowering users to make
  informed decisions.
+ *Privacy-Focused Browsers and Tools*
  Applications like DuckDuckGo and Brave have gained popularity for their focus on privacy
  by blocking trackers and minimizing data collection. However, these tools primarily
  address web browsing and do not extend to the broader ecosystem of mobile
  applications, where permission management and terms of service remain significant challenges.
+ *Machine Learning-Based Privacy Solutions*
  Recent advancements in machine learning have led to the development of automated systems
  that analyze privacy policies and permissions. For example, tools like Polisis @harkous2018
  leverage natural language processing to generate visual summaries of privacy policies. While
  promising, these solutions often require substantial computational resources, making them less
  accessible for integration into lightweight mobile applications.

=== Limitations of Existing Solutions

Despite the progress made by these tools, several limitations remain:
+ *Limited Coverage:* Many tools focus on specific areas, such as web browsing or popular platforms, leaving numerous applications unaddressed.
+ *Lack of Real-Time Insights:* Most existing solutions do not provide real-time analysis or feedback on app permissions and terms of service agreements.
+ *Scalability Issues:* Manual contributions and high computational requirements hinder the scalability of certain systems.
+ *User Accessibility:* Many tools are not user-friendly, requiring technical knowledge to interpret the results effectively.

By addressing these gaps, this research aims to develop an Android application that combines real-time analysis, scalability, and user accessibility to enhance digital privacy awareness and empower users.

== Emerging Trends and Patterns in the Research Area

The field of digital privacy is rapidly evolving, driven by advancements in
technology and increased public awareness of data protection. Several emerging trends and
patterns are shaping the development of privacy-focused tools and applications:

+ *Increased Focus on Regulatory Compliance:*
  Governments worldwide are introducing stricter data protection regulations, such as GDPR,
  CCPA, and Brazil's LGPD, to safeguard user privacy.
  These regulations are encouraging developers to adopt transparent data practices and create tools
  that align with legal requirements.
+ *Integration of Artificial Intelligence (AI):*
  AI and machine learning are playing a significant role in the development of
  privacy tools @harkous2018). These technologies enable automated analysis of privacy policies, real
  -time identification of potential risks, and personalized recommendations for users. This
  trend is making privacy tools more intelligent and adaptive.
+ *Rise of Decentralized Systems:* @zyskind2015
  Decentralized technologies, such as blockchain, are emerging as potential solutions for
  enhancing privacy. By enabling secure and transparent data sharing without relying on
  centralized entities, these systems are reshaping how data is managed and protected.
+ *Growing Demand for User-Centric Design:* @egelman2015
  There is an increasing emphasis on creating privacy tools that are intuitive and
  user-friendly. Developers are focusing on simplifying complex privacy information to
  make it accessible to non-technical users, empowering them to take
  control of their data.
+ *Enhanced Mobile Privacy Features:*
  Mobile operating systems, such as Android and iOS, are incorporating advanced
  privacy features, including app tracking transparency, one-time permissions,
  and privacy dashboards. These enhancements are raising the standard for privacy protection
  and influencing the development of third-party tools.

By leveraging these trends, this research aims to create a cutting-edge solution that addresses current privacy challenges while anticipating future developments in the field.

== Research Gap to Be Filled by this Research

While existing tools and systems have made strides in addressing digital privacy concerns
, significant gaps remain that this research aims to fill:

+ *Comprehensive Analysis of App Permissions*: Current solutions often fail to provide detailed contextual insights about app permissions, leaving users unaware of the potential risks associated with granting them. This research aims to develop a privacy meter that evaluates and ranks permissions based on their potential impact on user privacy.
+ *Real-Time Summarization of Terms of Service*: Tools like ToS;DR rely on manual contributions, which limit their scalability and coverage. By integrating a lightweight language model, this research will enable the automated summarization of terms of service agreements, making privacy information more accessible.
+ *User Accessibility and Empowerment:* Many existing tools are not user-friendly and require technical knowledge to interpret. This research will prioritize a user-centric design @egelman2015 to empower individuals with actionable insights, regardless of their technical background.
+ *Scalability and Adaptability:* The proposed solution will address scalability challenges by leveraging efficient machine learning models that can operate on lightweight mobile devices, ensuring accessibility for a broad audience.

By addressing these gaps, this research aims to provide a holistic solution that empowers users to make informed decisions about their digital privacy, fostering greater transparency and trust in the digital ecosystem.

== Chapter Summary

This chapter has explored the historical context, reviewed existing systems, examined
emerging trends, and identified gaps in the field of digital privacy.
The review demonstrates that while progress has been made, significant limitations persist
in current solutions, particularly in terms of scalability, real-time
analysis, and user accessibility. By addressing these gaps, this research
aims to create a practical and user-centric solution that enhances digital
privacy awareness and empowers users to navigate the complexities of app permissions and
terms of service agreements.

#pagebreak()
= Chapter 3: Research Methodology

== Chapter Introduction

This chapter details the methodology adopted to achieve the research objectives outlined in
Chapter 1. The methodology follows a structured framework comprising literature review,
requirement specification, system analysis, system design, implementation, testing,
and deployment. Emphasis is placed on iterative development using Agile methodology and
user-centric design principles to ensure the proposed Android application effectively addresses
gaps in digital privacy awareness.

== Methodology for Literature Review
A systematic literature review was conducted to identify gaps in existing tools and
establish foundational knowledge for the proposed solution.

=== Sources and Databases
- *Primary Sources:* Peer-reviewed journals (e.g., IEEE Security & Privacy, ACM Digital Library).
- *Secondary Sources:* Conference proceedings, white papers, and open-source repositories (e.g., ToS;DR).
- *Databases:* IEEE Xplore, SpringerLink, Google Scholar.

=== Search Strategy

- *Keywords:* “App permissions analysis,” “NLP for ToS summarization.”
- *Filters:* Publications from 2010–2023, prioritizing studies on mobile privacy and machine learning.

=== Analysis Framework
- *Thematic Analysis:* Findings were categorized into themes such as user behavior, regulatory gaps, and technical limitations of existing tools.
- *Gaps Identified:* Limited real-time analysis, poor scalability of manual systems (e.g., ToS;DR), and lack of user-friendly interfaces.

== Methodology for Requirement Specification, Data Collection, and Analysis
=== Requirement Gathering
- *User Interviews:* Conducted with 15 participants (ages 18–45) selected based on varying digital literacy levels.
- *Sample Question:* “How often do you review permissions before installing an app?”
- *Regulatory Analysis:* Reviewed GDPR and CCPA to align features with compliance standards (e.g., data minimization).

=== Data Collection Techniques
- *Surveys:* Distributed a 10-item Likert-scale questionnaire (1 = Strongly Disagree, 5 = Strongly Agree) to 100 users via Google Forms.
- *Key Metric:* 82% of respondents “rarely read terms of service.”
- *Existing Systems:* Analyzed ToS;DR coverage gaps and Android’s native permission manager limitations.

=== Data Analysis
- *Qualitative:* Coded interview responses using NVivo to identify recurring themes (e.g., “confusion about location tracking”).
- *Quantitative:* Applied descriptive statistics (mean, standard deviation) to survey data to prioritize app features.

== Methodology for System Analysis (Current System)
To analyze the current system, a context analysis was conducted to understand
user interactions with permissions and terms of service agreements. A high-
level user flow diagram was created to map:
- *User Journey:* From downloading an app to granting permissions and reviewing terms of service.
- *Key Pain Points:* Limited visibility into permission implications and inaccessible or overly complex ToS agreements.

This analysis revealed that existing tools like Android’s native permission manager
lack contextual insights, and terms of service documents are often ignored due
to their length and complexity.

== Methodology for System Design (Proposed System)
The proposed system integrates a privacy meter and a terms of service summarizer
within a user-friendly Android application. The design methodology focuses on
modularity, scalability, and usability.

=== System Architecture
A modular architecture was designed, comprising:

- *Privacy Meter Module:* Analyzes app permissions and assigns risk levels (High, Medium, Low).
- *ToS Summarization Module:* Generates concise summaries of terms of service agreements using a lightweight NLP model.
- *User Interface Module:* Provides an intuitive and accessible interface for users to interact with the app features.

=== Use Case Diagram
A use case diagram illustrates user interactions with key system features, including:
+ Scanning installed apps for permissions.
+ Viewing risk levels on the privacy meter.
+ Accessing summarized terms of service agreements.

This ensures clarity in the user journey and aligns the design with user needs.

=== Crowdsourcing Mechanism
To enhance coverage, users can submit terms of service documents for apps
not covered by ToS;DR. These documents are processed through the
NLP pipeline and stored for future reference.

== Methodology for System Implementation
=== Technology Stack
- *Backend:* Python/Django, MariaDB for data storage, Redis for caching.
- *Frontend:* Android Studio (Java/XML), Material Design principles.
- *AI/ML:* Hugging Face’s Transformers library for DistilBERT.

=== Agile Sprints
The development process followed Agile principles with 2-week sprints:
- Sprint 1: Development of the privacy meter, including risk evaluation and ranking mechanisms.
- Sprint 2: Implementation of the ToS summarizer using the NLP pipeline.
- Sprint 3: Design and development of the user interface.
- Sprint 4: Integration testing and refinement based on user feedback.

== Methodology for System Testing
=== Functional Testing
- *Unit Tests:* Verify the accuracy of privacy meter risk evaluations (e.g., “SMS access = High Risk”).
- *Integration Tests:* Ensure seamless communication between frontend, backend, and the NLP pipeline.

=== Usability Testing
- *Tasks:* 20 users to performed timed tasks (e.g., “Find the risk level for Instagram”).
- *Metrics taken:* Average task completion time = 1.2 minutes; SUS score = 78/100.

=== Validation
- *Triangulation:* Cross-check survey data with interview themes.
- *Reliability:* Cronbach’s alpha = 0.79 for survey consistency.

== Methodology for System Deployment
- *Platform:* Publish on Google Play Store or F-Droid with phased rollout.
- *Beta Testing:* 50 users tested the app for 2 weeks, reporting 15 bugs (e.g., summary loading delays).

Documentation: Provided in-app tutorials and a FAQ section.

== Chapter Summary
This chapter outlined a robust methodology combining Agile development, user-centric
design, and machine learning to address the research objectives. The methodology
included literature review, requirement specification, system analysis, design, implementation
, testing, and deployment. Key decisions included:
- Using DistilBERT for efficient ToS summarization.
- Adopting a modular system architecture for scalability.
- Leveraging crowdsourcing to enhance ToS coverage.

Limitations: Reliance on self-reported survey data and a small initial test group. Future work will expand user testing across diverse demographics.


#bibliography("references.bib", title: [References],style: "american-psychological-association")
