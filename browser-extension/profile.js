(() => {
  const personal = {
    fullName: "legal_name",
    givenName: "given_name",
    familyName: "family_name",
    preferredName: "preferred_name",
    email: "email",
    phone: "phone",
    addressLine1: "address_line_1",
    addressLine2: "address_line_2",
    city: "city",
    state: "state_or_territory",
    postcode: "postcode",
    country: "country",
    linkedin: "linkedin_url",
    website: "portfolio_url",
    github: "github_url",
  };

  function fromProfile(profile) {
    if (profile?.schema_version !== 1 || typeof profile.person !== "object" || !profile.person) {
      throw new Error("Choose a version 1 AutoApply AU profile.json with a person section.");
    }
    const fields = {};
    function include(key, value) {
      if (typeof value === "string" && value.trim()) fields[key] = value.trim();
    }
    for (const [key, source] of Object.entries(personal)) include(key, profile.person[source]);
    if (Array.isArray(profile.education) && profile.education.length === 1) {
      for (const key of ["institution", "degree", "major"]) include(key, profile.education[0]?.[key]);
    }
    return fields;
  }
  globalThis.AutoApplyProfile = Object.freeze({ fromProfile });
})();
