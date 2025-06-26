// src/components/TermsAndConditions.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../css/terms-and-conditions.css';

const TermsAndConditions = () => {
  return (
    <div className="terms-and-conditions">
      <div className="container">
       <h1>Terms and Conditions</h1>
        <p className="last-updated">Last Updated: June 2024</p>

        <section>
          <h2>1. Introduction</h2>
          <p>B2B Direct Data ("we","our") operates the "Service," which is defined as any website or web page on which this set of Terms appears ("Website"), and any data, services, activity or transactions that are offered, made available or facilitated through any of the above.</p>
          <p>These Terms of Service ("Terms of Service" or "Terms") are a legally binding agreement that applies to the Service and governs your use of the Service and your ("you" or "your") relationship with us. You accept and agree to these Terms of Service by either:</p>
          <ul>
            <li>Accessing or using the Service;</li>
            <li>Clicking to accept these Terms of Service, or</li>
            <li>Accepting these Terms of Service in any other way.</li>
          </ul>
          <p>If you violate these Terms of Service, or if you do not agree to these Terms of Service, you shouldn't access (and you don't have our permission to access) the Service.</p>
          <p>In addition, if you intend to provide to us, or receive from us, data regarding European residents, please see Section 13, which you must agree to.</p>
        </section>

        <section>
          <h2>2. Changes to the Terms of Service</h2>
          <p>We may modify these Terms of Service in our sole discretion by posting updated versions of these Terms of Service on the Website or otherwise providing notice to you. All such changes shall become effective upon the posting of the revised Terms of Service on the Website or upon notice, as applicable.</p>
        </section>

        <section>
          <h2>3. Changes to the Service</h2>
          <p>We may change the features and functionality of the Service at any time. This may include adding, modifying or removing any features or functionality of the Service. The Terms of Service will apply to any changed version of the Service. We also may suspend or stop the Service altogether. In addition, we may impose or alter fees for new or existing aspects of the Service.</p>
        </section>

        <section>
          <h2>4. Eligibility Restrictions</h2>
          <p>To use the Service, you must have reached the age of majority in the jurisdiction where you live (in most U.S. states, that's 18 years old). If you are under this age, you shouldn't use the Service or provide Submitted Data (defined below) to us.</p>
        </section>

        <section>
          <h2>5. Your Account</h2>
          <p>You will need to set up an account in order to access most aspects of the Service, including in most cases to submit data ("Submitted Data") or to receive data ("Output Data"). You should read the important information about the rules governing the Submitted Data and Output Data, in the sections below. Important rules also govern your account itself. First, you must only provide account information (such as your name and email address) that is your own, and that is accurate. You should keep your contact information accurate as well, so that we can contact you if we need to, such as to deliver any important notices. We also strongly recommend changing your password periodically, and that you not share your password or account credentials with anyone else.</p>
          <p>You are solely responsible for maintaining the confidentiality of your account information, such as your username and password, and for restricting access to your computer and other devices; you agree and understand that you will be liable for any activity occurring through your account.</p>
        </section>

        <section>
          <h2>6. Your License to the Service</h2>
          <p>You may be and hereby are granted a license to use the Service and Output Data for (and solely for) your personal and/or your internal business purposes only, subject to the prohibitions and restrictions herein, and a license to store, print or make a copy of Output Data we provide to you solely for your personal or internal business purposes. You may not resell, distribute, or create derivative works from the Service or the Output Data. You may not develop any service, product, toolset, dataset or derivative work from the Output Data or the Service, whether in aggregated or non-aggregated form, and whether in identified or de-identified form.</p>
        </section>

        <section>
          <h2>7. Data Sharing and Rights: Our Free Services</h2>
          <p>When you provide Submitted Data through the Service, you understand and agree to the following, except where we and you have put in place a Premium Services Agreement (or other agreement) that expressly supersedes the below terms:</p>
          
          <h3>A. The Licenses You Grant To Us</h3>
          <p>When you provide us with or make available to us any Submitted Data, such as names, addresses, business titles or phone numbers of contacts or other persons, you are granting us several licenses to use that data (and you are representing to us that you have the right to make this grant):</p>
          <ul>
            <li>You grant us a perpetual and irrevocable license to access and use the Submitted Data in aggregated form, to provide, develop and improve the Service and our data assets, so long as we do not (i) in any public way refer to you or the company you work for in relation to the Submitted Data (for instance, we will never sell a list titled "List of Brand X's Clients), or (ii) use the Submitted Data in a way that violates any contract we have entered into, or any law.</li>
            <li>You also provide us the perpetual and irrevocable right to sublicense, make available, copy, display, publish or distribute the Submitted Data to any third party, including our customers, business partners, and service providers.</li>
            <li>You provide us the right to create derivative works, data models, or modeled data sets with the Submitted Data. You agree that we will own those derivative works (but not the actual Submitted Data that is distinct from those works). Examples of derivative works (without limitation) would be, for instance, if we create aggregated or modeled data sets that combine data from numerous providers in order to form a new or new type of data set. Another example would be if we used multiple sets of Submitted Data (from multiple providers) in order to derive data analytics about certain industries, buyers, or industry prospects.</li>
            <li>You also agree that we have the perpetual and irrevocable right to use, share, sublicense, display, copy, publish and distribute the Submitted Data in aggregated, de-identified form for any purpose, in any medium.</li>
            <li>The foregoing license grants to B2B Direct Data shall be non-exclusive, perpetual and royalty-free. B2B Direct Data shall have the right to sublicense, assign, or transfer such licenses in its discretion.</li>
          </ul>

          <h3>B. The Representations You Make To Us</h3>
          <p>It is important to us that you have the right to grant us the licenses we've described above. If you don't, please do not provide any Submitted Data to us. If you're not sure whether you do, please take the time to confirm whether that is the case. We will still be here when you're ready.</p>
          <ul>
            <li>You therefore warrant and represent that you have all necessary rights, permissions, and authority to provide the Submitted Data to us (in whole and in part), and that doing so will not put you in violation of any contracts you have signed or any laws. We provide certain examples of laws that theoretically could apply, so please continue to read.</li>
            <li>You likewise warrant and represent that the Submitted Data does not contain any information about individuals under the age of 18.</li>
            <li>You warrant and represent that providing the Submitted Data to us does not violate the U.S. HIPAA law: for instance, it is not a list of hospital or doctor's patients, or a similar dataset consisting of patients or clients of an entity covered by HIPAA (this might include, for instance, a doctor, dentist, chiropractor, acupuncturist, pharmacist or other health professional). Similarly, you agree not to provide us with Submitted Data consisting of a list of clients of an entity covered by the GLBA, which applies to many types of financial institutions including banks, hedge funds, investment advisers and insurance companies.</li>
            <li>You warrant and represent that you will only provide Submitted Data to us that is true and accurate, and of living persons.</li>
          </ul>

          <h3>C. Nature of Exchange</h3>
          <p>Our Service contains certain "co-operative" elements. This means that in exchange for providing the Submitted Data to us, and potentially for the use of other customers (at our sole discretion), you will receive access to Output Data consisting of information that we hope is equally valuable to you. While we strive to make this a fair and optimal exchange, you understand and agree that we may change these terms or the nature of the Service at any time, or alter the amount of Output Data or other access we provide – and you agree that it is in our sole discretion to do so. We likewise may terminate your account or access to the Service at any time, for any reason, including (without limitation) any violation of these Terms of Service by you or through your account. Additional rules or policies may be displayed or put in place through the Service, including any portal through which you submit or receive data; those rules or policies are incorporated by reference into these Terms of Service and you agree to adhere to them.</p>
        </section>

        {/* Continue with all other sections following the same pattern */}
        {/* I've included the first few sections - you would continue with the rest */}

        <section>
          <h2>24. Force Majeure</h2>
          <p>Neither party to these terms will be deemed responsible or liable for its failure to perform or delay in performance under these Terms (or any Order Form) where such delay or failure is beyond its control, such as where caused by strikes or labor disputes, internet or telecommunications failures, shortages of or inability to obtain labor, energy, or supplies, war, terrorism, riot, acts of God or governmental action, natural disasters including floods, earthquakes and hurricanes, acts by hackers or other malicious third parties and problems with the Internet generally, and such performance shall be excused to the extent that it is prevented or delayed by reason of any of the foregoing.</p>
        </section>

        <section>
          <h2>8. Paid and Subscription Accounts; Self-Serve Credits</h2>
          <p>We also may provide the Service through paid accounts, such as by offering a monthly or annual subscription, or through customized provision of services and payment terms. If you and we agree to do so, we will enter into a separate agreement with you, governed by an applicable further Order Form ("Order Form"). If you wish to enter into such an agreement, please contact us at support@b2bdirectdata.io. In addition (unless otherwise agreed to by you and us), the following will apply to any paid Service we provide to you:</p>
          <p>Sometimes we offer the Service on a "self-serve" basis, in which case you will have the opportunity to click through these Terms and select the aspects of the Service you want to purchase, including an amount of credits that can be used for data. When you purchase credits, they have an expiration date, which is generally the end of your billing cycle – for most accounts, the end of the month. Do not purchase credits if you are not able to use them during your billing cycle.</p>
          
          <h3>A. Payment Terms</h3>
          <p>You agree to pay to us the applicable fees (the "Fees") set forth in an Order Form (whether agreed to on paper or digitally) signed or otherwise agreed to by you and by us, based on the timetable set forth in the Order Form. We may increase or otherwise change the Fees at the end of any given calendar year or at the end of any Term set forth in an Order Form, in our sole discretion, by providing you with written notice (which may be by email or another conspicuous method).</p>

          <h3>B. Disputes</h3>
          <p>You must raise any disputes regarding Fees within 60 days from receipt of the (first) applicable invoice. Any disputes not waived within that time period shall be deemed waived.</p>

          <h3>C. Late Payments</h3>
          <p>Invoices must be paid in full no later than thirty (30) days from the date on which they are received. Unpaid amounts are subject to a finance charge of 1.5% per month on any outstanding balance, or the maximum permitted by law, whichever is lower, plus all expenses of collection (including reasonable attorneys fees) that we may incur. We reserve the right to terminate service immediately where bills are more than sixty (60) days in arrears.</p>

          <h3>D. Taxes</h3>
          <p>You are responsible for all taxes associated with the Service other than taxes based on our net income.</p>

          <h3>E. Term and Renewal</h3>
          <p>The agreement is for the Initial Service Term as specified in the Order Form, and shall be automatically renewed for additional periods of the same duration as the Initial Service Term, unless either party requests non-renewal at least thirty (30) days prior to the end of the then-current term. The subscription is on a per-seat basis, and is for a single "seat" or user unless otherwise indicated in the Order Form.</p>

          <h3>F. Termination for Breach</h3>
          <p>In addition to any other remedies it may have, either party may also terminate this agreement upon thirty (30) days' notice (or without notice in the case of nonpayment), if the other party materially breaches any of the terms or conditions of this agreement. Customer will pay in full for the Service up to and including the last day on which the Service is provided. All sections of this agree which by their nature should survive termination will survive termination, including, without limitation, accrued rights to payment, confidentiality obligations, warranty disclaimers, and limitations of liability.</p>

          <h3>G. Fair Use Policy</h3>
          <p>B2B Direct Data's Unlimited Plans operate under a Fair Use Policy in order to prevent potential abuse. The credit limit is 10,000 credits per account per month for non-paying accounts on an Unlimited Plan, or the lesser of $ Paid / $0.025 or 1 Million credits per account per year for paying accounts on an Unlimited Plan, unless we will enter into a separate agreement with you that specifies a different credit limit, governed by an applicable further Order Form.</p>

          <h3>H. Cancellation Policy</h3>
          <p>For subscription customers without an Order Form, you must cancel your subscription prior to 11:59 p.m. Pacific Time on the day before your next recurring billing date in order to avoid being charged. Payments are nonrefundable and there are no refunds or credits for partially used periods. Following any cancellation, however, you may choose to have access to the service through the end of your current billing period. At any time, and for any reason, we may provide a refund, discount, or other consideration to some or all of our members ("credits"). The amount and form of such credits, and the decision to provide them, are at our sole and absolute discretion. The provision of credits in one instance does not entitle you to credits in the future for similar instances, nor does it obligate us to provide credits in the future, under any circumstance.</p>
        </section>

        <section>
          <h2>9. Proprietary Rights: What We Own</h2>
          <p>As between you and B2B Direct Data, all rights, title and interest in and to the Service, including without limitation patents, copyrights, trademarks, trade names, service marks, trade secrets and other intellectual property rights, and any goodwill associated with the Service, are owned by B2B Direct Data. For instance, we own any design or product features inherent in the Service, such as the way that data is organized, curated, presented and delivered, and any know-how or other intellectual property inherent in the way we have create, provide, display or make available the Service. The B2B Direct Data names and logos are trademarks of B2B Direct Data, and may not be copied, imitated or used, in whole or in part, without our prior written permission.</p>
          <p>These Terms of Service do not grant you any ownership right, title or interest in any of the above. You therefore may not use the Output Data to create any derivative work, service or product, and you may not resell or re-license the Output Data in any manner or form.</p>
        </section>

        <section>
          <h2>10. Restrictions on Use of Output Data</h2>
          <p>You agree not to use the Service or Output Data in certain ways. You agree not to use the Service or Output Data to:</p>
          <ol className="lettered-list">
            <li>violate any applicable laws (whether federal, state, or international to the U.S.) ("Laws"),</li>
            <li>violate the U.S. CAN-SPAM Act of 2003 or the Canadian Anti-Spam Legislation (CASL), as such statutes may be amended from time to time, or the U.S. TCPA. For information on CAN-SPAM, go here; for information on CASL, go here; and for information on the TCPA, go here;</li>
            <li>use the Output Data to advertise or promote any goods or services (or send any other communications) that are illegal in the place offered or consumers,</li>
            <li>use the advertise or promote adult service (such as pornography or escort services), tobacco products, illegal gambling, counterfeit or pirated goods or services, or violate any securities or commodities regulations (such as to support a "pump and dump" scheme);</li>
            <li>defraud, deceive or mislead anyone;</li>
            <li>communicate or transmit content that is defamatory, dishonest, obscene, sexually explicit, pornographic, vulgar or offensive;</li>
            <li>promote or engage in discrimination, racism, harassment or hate speech against any individual or group; or</li>
            <li>threaten or promote violence.</li>
          </ol>
        </section>

        <section>
          <h2>11. Restriction on Use of Email Services</h2>
          <p>The following practices are not permitted from our service and would be considered a violation of our policy. Please find below some examples. They are subject to change.</p>
          <ol className="lettered-list">
            <li>send from a group distribution email such as hello@ or marketing@etc;</li>
            <li>not include opt out messages to any commercial emails or failing to comply with applicable laws;</li>
            <li>use a fictional identity or a pseudonym or an alias to send emails;</li>
            <li>send emails that generate an unacceptable level of bounces;</li>
            <li>send emails that generate an unacceptable level of spam or complaints;</li>
            <li>transmit material that contains or links to virus, trojan horse, worms or any malicious or harmful software program;</li>
            <li>use B2B Direct Data's service in conjunction with any unsolicited or harassing messages (commercial or otherwise) including but not limited to unsolicited emails, or phone calls</li>
          </ol>
          <p>If you know or suspect anyone violating these policies, please notify us at abuse@b2bdirectdata.io. B2B Direct Data will determine compliance of this policy at its sole discretion.</p>
        </section>

        <section>
          <h2>12. Additional Restrictions on Use of the Service and Your Account</h2>
          <p>You also agree to certain restrictions on your use of the Service. You may not:</p>
          <ol className="lettered-list">
            <li>allow any other person to use your account, use any other person's account, or share your password or account credentials with any other person;</li>
            <li>transmit information to or through the Service that is fake or fictitious;</li>
            <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity;</li>
            <li>access the Service in a way that exceeds your authority, such as by logging in to a server, account, or email network when you are not authorized to do so;</li>
            <li>access the Service in an automated manner;</li>
            <li>extract data from the Service in a way that exceeds our authorization or violates these terms or other policies or restrictions we have implemented (whether such implementation is verbal or mechanical in nature); for instance you may not or use or attempt to use any engine, software, tool, agent or other device or mechanism (including browsers, spiders, robots, avatars or intelligent agents) to navigate or search any portion of the Site, other than the search engine and search agents made available through the Service;</li>
            <li>reverse engineer, decompile or disassemble the Service (in whole or in part).</li>
          </ol>
        </section>

        <section>
          <h2>13. Special Terms for Use of Customer Personal Data of or Output Data About European Data Subjects</h2>
          <p>You may request and receive Output Data regarding data subjects who reside in the European Economic Area, Switzerland, or the United Kingdom ("European Data Subjects") (such as their name, job title, or contact information), which we refer to below as European Output Data." If you do so, you agree that you will use the Output Data only in the following situations, in addition to complying with other consent or permission requirements set out in this Section:</p>
          <ol className="lettered-list">
            <li>in order to perform reasonable and actual data validation or hygiene or updating of your own legally obtained customer database. For instance (simply to illustrate), if you possess a data file that reads [Jane Doe | Acme Computers | janedoe@Acme.com] you may use our Output Data to update that file to read [Jane Doe | Acme Computers Limited | janedoe@AcmeLimited.com].</li>
            <li>pursuant to explicit consent from the data subject of the Output Data, sufficient to comply with the consent requirements of GDPR.</li>
            <li>for other purposes you have established are necessary to pursue your legitimate interests in the context of business-to-business relationships and in compliance with the GDPR and all other legal requirements. For instance, if you use the Output Data to contact actual or prospective business partners, you may need to obtain consent for "prospecting" by means of a telephone, fax machine or email.</li>
          </ol>
          <p>When you receive or use European Output Data, you understand and agree that you are the data controller, and we are your data processor, as those terms are used under the GDPR. You will obtain from each data subject (e.g., the persons in your customer database) all required consents (or establish another basis for processing the Output Data, if applicable), make available all required data subject rights, and otherwise comply with all provisions of the GDPR and other European data protection rules applicable to data controllers.</p>
          <p>You also agree that you will not provide any Submitted Data to us regarding any European Data Subjects unless you have obtained legally sufficient consent to do so from the data subject of that Submitted Data.</p>
          <p>To the extent that B2B Direct Data processes any Customer Personal Data (as defined in the B2B Direct Data Data Processing Agreement) that is subject to the European General Data Protection Regulation (GDPR) or other applicable European data protection rules, on Customer's behalf, in the provision of the services hereunder, the terms of the B2B Direct Data Data Processing Agreement, which are hereby incorporated by reference, shall apply. For customers that are located in the European Union, the United Kingdom, Switzerland, or the European Economic Area, the Standard Contractual Clauses adopted by the European Commission, attached to the Data Processing Agreement, with B2B Direct Data, which provide adequate safeguards with respect to the personal data processed by us under this Agreement and pursuant to the provisions of our Data Processing Agreement apply.</p>
          <p>This Section 13 supersedes and takes precedence over any separate agreement or terms that we may enter into with you, regarding any data licensed from you to us, or from us to you.</p>
          <p>Required Consumer Consents and Permissions. In some countries or jurisdictions, additional consents, notices and permissions may be required for certain types of marketing or processing of personal information. Client understands that, while Provider seeks to comply with its own legal obligations, Provider has not obtained any rights or consents on Client's behalf: therefore, to the extent that any law or regulation may require that Client (in addition to Provider) provide notice or obtain consent in order to market to any person or process any person's personal data, Client agrees that Client shall obtain on Client's own behalf such notices or consents.</p>
        </section>

        <section>
          <h2>14. Privacy Policy</h2>
          <p>You acknowledge the collection, use, disclosure and other handling of information described in our Privacy Policy, which we may update from time to time.</p>
        </section>

        <section>
          <h2>15. We May Monitor the Service</h2>
          <p>We, or service providers working with us, may monitor the Service for any legitimate business purpose, including to monitor compliance with these Terms or evaluate how the Service is being accessed and used. We will be the sole and final arbiter as to whether the Service is being misused or these Terms are being violated. If we believe you have violated these Terms (or any law) we may terminate your account and access to the Service and any Output Data immediately and without notice. In such a situation we also may seek civil, criminal or injunctive relief, at its sole discretion and without obligation, to enforce this Terms of Service and the law.</p>
        </section>

        <section>
          <h2>16. Disclaimer of Representations and Warranties</h2>
          <p>YOUR USE OF THE SERVICE IS AT YOUR OWN RISK. THE SERVICE ALONG WITH THE OUTPUT DATA IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE DISCLAIM ALL WARRANTIES AND REPRESENTATIONS, EITHER EXPRESS OR IMPLIED, WITH RESPECT TO THE SERVICE, INCLUDING, WITHOUT LIMITATION, ANY WARRANTIES (1) OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE, (2) OF INFORMATIONAL CONTENT OR ACCURACY, (3) OF NON-INFRINGEMENT, (4) OF PERFORMANCE, (5) OF TITLE, (6) THAT THE SERVICE WILL OPERATE IN AN ERROR FREE, TIMELY, SECURE, OR UNINTERRUPTED MANNER, IS CURRENT AND UP TO DATE AND ACCURATELY DESCRIBES ANYTHING, OR IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS, (7) THAT ANY DEFECTS OR ERRORS IN THE SERVICE WILL BE CORRECTED, (8) THAT THE SERVICE IS COMPATIBLE WITH ANY PARTICULAR HARDWARE OR SOFTWARE PLATFORM, OR (9) THAT WE WILL ENFORCE THE TERMS OF SERVICE AGAINST OTHERS TO YOUR SATISFACTION. EFFORTS BY B2B DIRECT DATA TO MODIFY THE SERVICE SHALL NOT BE DEEMED A WAIVER OF THESE LIMITATIONS OR ANY OTHER PROVISION OF THESE TERMS OF SERVICE. Some jurisdictions limit or don't allow the disclaimer of implied warranties – in those states, these warranties will be disclaimed only to fullest extent permitted by law.</p>
        </section>

        <section>
          <h2>17. Limitation of Liability</h2>
          <p>IN NO EVENT WILL EITHER PARTY OR ITS RESPECTIVE OFFICERS, DIRECTORS, AGENTS, EMPLOYEES, REPRESENTATIVES, AFFILIATES, PARENTS, SUBSIDIARIES, SUBLICENSEES, SUCCESSORS AND ASSIGNS, INDEPENDENT CONTRACTORS, AND RELATED PARTIES BE LIABLE TO THE OTHER PARTY FOR ANY LOSS OF PROFITS, LOSS OF USE, LOSS OF DATA, INTERRUPTION OF BUSINESS, OR ANY INDIRECT, INCIDENTAL, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN ANY WAY CONNECTED WITH THE USE OF THE SERVICE, OUTPUT DATA OR WITH THE DELAY OR INABILITY TO USE SAME, OR FOR ANY BREACH OF SECURITY, OR FOR ANY CONTENT, PRODUCTS, AND SERVICES OBTAINED THROUGH OR VIEWED ON THE SERVICE, OR OTHERWISE ARISING OUT OF THE USE OF SAME, WHETHER BASED ON CONTRACT, TORT, STRICT LIABILITY, REGULATION, COMMON LAW PRECEDENT OR OTHERWISE, EVEN IF THE RESPECTIVE PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF DAMAGES AND EVEN IF SUCH DAMAGES RESULT FROM A PARTY'S ENTITY'S NEGLIGENCE OR GROSS NEGLIGENCE. IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE (EXCLUSIVE OF PAYMENT OR INDEMNIFICATION OBLIGATIONS) EXCEED THE TOTAL OF THE AMOUNT PAID BY EITHER PARTY TO THE OTHER DURING THE PRIOR 12 MONTHS. ADDITIONAL DISCLAIMERS BY B2B DIRECT DATA MAY APPEAR WITHIN THE SERVICE AND ARE INCORPORATED HEREIN BY REFERENCE. TO THE EXTENT ANY SUCH DISCLAIMERS PLACE GREATER RESTRICTIONS ON YOUR USE OF THE SERVICE OR THE MATERIAL CONTAINED THEREIN, SUCH GREATER RESTRICTIONS SHALL APPLY. Some jurisdictions restrict or do not allow the limitation of liability in contracts, and as a result the contents of this section may not apply to you. In cases where such laws apply, liability of the B2B Direct Data Entities shall be limited to the fullest extent permitted by law.</p>
        </section>

        <section>
          <h2>18. Indemnification</h2>
          <p>You agree to indemnify and hold harmless B2B Direct Data, its directors, officers, employees, contractors and agents, and its suppliers, licensors, and service providers, from and against any loss, liability, claim, demand, damages, costs and expenses, including reasonable attorneys' fees and expenses (collectively, "Claims"), arising out of or in connection with: (1) Your use of the Website or Service; (2) Your breach of these Terms of Service; or (3) Your violation of any applicable law or the rights held by any third party. B2B Direct Data will have the right, but not the obligation, to participate through counsel of its choice in any defense by You of any Claims as to which You are required to defend, indemnify, or hold harmless B2B Direct Data. You may not settle any Claims in a manner that may impose any obligation upon B2B Direct Data, without our prior written consent. The members of B2B Direct Data's corporate family, and the agents, partners, employees, contractors and advertisers of them and of B2B Direct Data, are third-party beneficiaries of this paragraph. Other than them, there are no other third-party beneficiaries of the Terms of Service.</p>
        </section>

        <section>
          <h2>19. Other</h2>
          <h3>A. Complete Agreement and Understanding</h3>
          <p>These Terms of Service are the entire and exclusive understanding and agreement between us and you regarding the Service, and these Terms supersede and replace any and all prior oral or written understandings or agreements between us and you regarding such topic, provided that any express modification in an Order Form shall govern and supersede any conflicting provision in these Terms. If we (or you) don't enforce any part of these Terms, it won't be considered a waiver.</p>

          <h3>B. Our Relationship With You</h3>
          <p>The relationship between you and us is that of independent contractors, and nothing in these Terms of Service shall be construed to create or imply any other relationship such as a partnership or an employer/employee or agency relationship.</p>

          <h3>C. Assignment and Waiver</h3>
          <p>B2B Direct Data may assign these Terms at its discretion. You may not assign, sublicense or transfer these Terms (or our license grant to you herein) in whole or in part to anyone else. No waiver of any obligation or right of either party shall be effective unless in writing, executed by the party against whom it is being enforced.</p>
        </section>

        <section>
          <h2>20. Account Security</h2>
          <p>We make no representations or promises regarding security. Despite our security efforts, it is possible that unauthorized individuals will obtain your information, such as through web-scraping tools (even though we do not authorize and in fact prohibit that behavior).</p>
          <ul>
            <li>Customer users are responsible for accessing the Company network, systems, or application only through encrypted connections.</li>
            <li>Customer users are responsible for maintaining up-to-date OS (operating system) patching and active antimalware on the end-user devices used to connect to the Company environment.</li>
            <li>Customers are responsible for ensuring that all terminated employees have their access revoked to the Company application within 24 hours of termination.</li>
            <li>Customers are required to notify Company within 72 hours of security incidents that could have implications to Company (e.g. Company application user with compromised credentials, stolen laptop of a Company user, partner network compromise including malware worm or ransomware, etc.)</li>
            <li>Customer users are responsible for keeping user IDs and passwords used to access Company systems confidential at all times. Customer agrees to keep Company Intellectual Property and proprietary information confidential.</li>
            <li>B2B Direct Data runs a vulnerability discovery program. If you suspect there are any vulnerability with our services, please reach out to support@b2bdirectdata.io and we will look into those for you.</li>
          </ul>
        </section>

        <section>
          <h2>21. Linked Services</h2>
          <p>The Service may contain links to — or even reside on — third-party websites and services that are not owned or controlled by us. The Service may sometimes makes available embedded links or content from such services, such as for promotions or information hosted by a third-party website. We do not assume responsibility for any such third-party websites, services or content. If you view, access or otherwise interact with any such websites, services or content, you do so at your own risk and you agree that we no liability arising from such access.</p>
        </section>

        <section>
          <h2>22. Termination</h2>
          <p>In addition to any other remedies it may have, either party may terminate this Agreement effective immediately, if the other party materially breaches any of the terms or conditions of this Agreement and fails to cure such material breach within thirty (30) days of its receipt of a written notice identifying the breach in reasonable detail (or ten (10) days in the case of non-payment). In addition, (a) for paid subscriptions, we may terminate this Agreement for convenience by providing You at least thirty (30) days' prior written notice; and (b) for unpaid accounts only, either party may terminate this Agreement, effective immediately, by providing the other party written notice. For paid subscriptions, Customer will pay in full for the Service up to and including the last day on which the Service is provided.</p>
          <p>Legal notices (including but not limited to termination notices) must be sent to support@b2bdirectdata.io or Cyber Hub, Level 1, Tower A, Bldg. # 10, Cyber City, Phase II. Gurgaon-122002. Haryana. We will send legal notices to You via a method of our choosing that is reasonably intended to provide such notice to You, including without limitation via the Service or to the email or other address You have provided to us.</p>
          <p>If this Agreement terminates, You will no longer be authorized to access the Website or Services. Sections 7-9, 10, 11, 15-18 and 21-22 of the Agreement will survive termination.</p>
        </section>

        <section>
          <h2>23. Severability</h2>
          <p>If any provision of these Terms is determined by a court to be invalid, illegal or unenforceable, that determination will not affect the validity or enforceability of the remaining provisions of the Terms, and each provision shall be considered as separate, severable and distinct from each other.</p>
        </section>

        <section>
          <h2>24. Force Majeure</h2>
          <p>Neither party to these terms will be deemed responsible or liable for its failure to perform or delay in performance under these Terms (or any Order Form) where such delay or failure is beyond its control, such as where caused by strikes or labor disputes, internet or telecommunications failures, shortages of or inability to obtain labor, energy, or supplies, war, terrorism, riot, acts of God or governmental action, natural disasters including floods, earthquakes and hurricanes, acts by hackers or other malicious third parties and problems with the Internet generally, and such performance shall be excused to the extent that it is prevented or delayed by reason of any of the foregoing.</p>
        </section>

        <div className="back-to-home">
          <Link to="/" className="back-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;