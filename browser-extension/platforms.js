// Runs in the extension's isolated world. Host and path identify the portal;
// a page's text or branding cannot opt an unrelated website into autofill.
(() => {
  "use strict";

  const portals = [
    { id: "workday", name: "Workday", host: /(?:^|\.)myworkdayjobs\.com$/ },
    { id: "workday", name: "Workday", host: /(?:^|\.)myworkdaysite\.com$/, path: /^\/recruiting(?:\/|$)/i },
    { id: "workday", name: "Workday", host: /(?:^|\.)myworkday\.com$/, path: /\/recruiting(?:\/|$)/i },
    { id: "greenhouse", name: "Greenhouse", host: /^(?:job-boards|boards)(?:\.eu)?\.greenhouse\.io$/ },
    { id: "lever", name: "Lever", host: /^jobs(?:\.eu)?\.lever\.co$/ },
    { id: "ashby", name: "Ashby", host: /^jobs\.ashbyhq\.com$/ },
    { id: "oracle", name: "Oracle Recruiting Cloud", host: /(?:^|\.)oraclecloud\.com$/, path: /^\/hcmUI\/CandidateExperience(?:\/|$)/i },
    { id: "oracle", name: "Oracle Recruiting Cloud", host: /^careers\.oracle\.com$/, path: /^\/[a-z]{2}(?:[-_][a-z]{2})?\/sites\/[^/]+(?:\/|$)/i },
    { id: "taleo", name: "Oracle Taleo", host: /(?:^|\.)taleo\.net$/, path: /^\/careersection(?:\/|$)/i },
    { id: "icims", name: "iCIMS", host: /(?:^|\.)icims\.com$/, path: /^\/(?:jobs|connect|candidate)(?:\/|$)/i },
    { id: "smartrecruiters", name: "SmartRecruiters", host: /^(?:jobs|careers)\.smartrecruiters\.com$/ },
    { id: "smartrecruiters", name: "SmartRecruiters", host: /^www\.smartrecruiters\.com$/, path: /^\/oneclick-ui\//i },
    { id: "workable", name: "Workable", host: /^apply\.workable\.com$/ },
    { id: "workable", name: "Workable", host: /(?:^|\.)workable\.com$/, path: /^\/(?:j\/[^/]+|jobs\/\d+\/candidates\/new)(?:\/|$)/i },
    { id: "jobvite", name: "Jobvite", host: /^jobs\.jobvite\.com$/ },
    { id: "jobvite", name: "Jobvite", host: /^app\.jobvite\.com$/, path: /^\/j(?:\/|$)/i },
    { id: "bamboohr", name: "BambooHR", host: /(?:^|\.)bamboohr\.com$/, path: /^\/(?:careers|jobs)(?:\/|$)/i },
    { id: "pageup", name: "PageUp", host: /(?:^|\.)pageuppeople\.com$/, path: /^\/apply\//i },
  ];

  function detect(location) {
    const portal = location.protocol === "https:" && portals.find((entry) =>
      entry.host.test(location.hostname.toLowerCase()) && (!entry.path || entry.path.test(location.pathname)));
    return portal ? { id: portal.id, name: portal.name } : { id: "generic", name: "Other application portal" };
  }

  // These are identifiers on form controls. Match complete names. In particular,
  // "countryOfBirth", "previousCountry" and "referenceEmail" are different fields.
  const contact = {
    firstname: "givenName", givenname: "givenName", lastname: "familyName", familyname: "familyName",
    surname: "familyName", fullname: "fullName", preferredname: "preferredName",
    email: "email", emailaddress: "email", phone: "phone", phonenumber: "phone",
    mobilenumber: "phone", addressline1: "addressLine1", addressline2: "addressLine2",
    city: "city", suburb: "city", state: "state", postcode: "postcode", postalcode: "postcode",
    zipcode: "postcode", country: "country", linkedinurl: "linkedin", portfoliourl: "website",
    githuburl: "github",
  };

  const knownIds = new Set(portals.map((entry) => entry.id));
  const byPortal = {
    workday: {
      legalnamesectionfirstname: "givenName", legalnamesectionlastname: "familyName",
      addresssectionaddressline1: "addressLine1", addresssectionaddressline2: "addressLine2",
      addresssectioncity: "city",
      addresssectionpostalcode: "postcode", addresssectioncountry: "country",
      emailaddresssectionemailaddress: "email",
    },
    greenhouse: {
      jobapplicationfirstname: "givenName", jobapplicationlastname: "familyName",
      jobapplicationpreferredname: "preferredName", jobapplicationemail: "email",
      jobapplicationphone: "phone",
    },
    lever: { name: "fullName", urlslinkedin: "linkedin", urlsgithub: "github", urlsportfolio: "website" },
    ashby: {
      systemfieldname: "fullName", systemfieldemail: "email", systemfieldphone: "phone",
      systemfieldlinkedin: "linkedin",
    },
    icims: {
      personprofilefieldsfirstname: "givenName", personprofilefieldslastname: "familyName",
      personprofilefieldsemail: "email", personprofilefieldsaddresscity: "city",
      personprofilefieldsaddresszip: "postcode", personprofilefieldsaddresszipcode: "postcode",
      personprofilefieldsaddresscountry: "country", personprofilefieldsaddressstate: "state",
    },
  };

  const attributeNames = ["name", "id", "data-automation-id", "data-ui", "data-qa", "data-testid"];

  function identifiers(element) {
    return attributeNames.map((attribute) => element.getAttribute(attribute)).filter(Boolean);
  }

  function isHistoryContact(element, platformId) {
    const names = identifiers(element);
    if (platformId === "workday") {
      return names.some((name) => /(?:workExperience|education|certification)[-_]\d+[-_.:]/i.test(name));
    }
    if (platformId === "icims") {
      return names.some((name) => /ProfileFields\./i.test(name) &&
        (!/^PersonProfileFields\./i.test(name) || /^PersonProfileFields\.rcf\d/i.test(name)));
    }
    return false;
  }

  function fieldKey(element, platformId) {
    if (!knownIds.has(platformId) || isHistoryContact(element, platformId)) return null;
    const matches = new Set();
    for (let identifier of identifiers(element)) {
      if (platformId === "taleo") {
        // Taleo can prefix the ID with a form/panel namespace.
        const personal = /^(?:[\w-]+:)*personalInformation:([\w-]+)$/i.exec(identifier);
        if (personal) identifier = personal[1];
      }
      const token = identifier.toLowerCase().replace(/[^a-z0-9]/g, "");
      const overrides = byPortal[platformId];
      if (overrides && Object.hasOwn(overrides, token)) {
        matches.add(overrides[token]);
      } else if (Object.hasOwn(contact, token)) {
        matches.add(contact[token]);
      }
    }
    return matches.size === 1 ? matches.values().next().value : null;
  }

  globalThis.AutoApplyPlatforms = Object.freeze({ detect, fieldKey, isHistoryContact });
})();
