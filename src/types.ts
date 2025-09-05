/**
 * A JSON schema for the RChilli Resume Parser API response.
 */
export interface SchemaType {
  ResumeParserData: {
    ResumeFileName: string | null;
    ResumeLanguage: {
      Language: string;
      LanguageCode: string;
    };
    ParsingDate: string | null;
    ResumeCountry: {
      Country: string;
      Evidence: string;
      CountryCode: {
        IsoAlpha2: string;
        IsoAlpha3: string;
        UNCode: string;
      };
    };
    Name: {
      FullName: string;
      TitleName: string | null;
      FirstName: string;
      MiddleName: string | null;
      LastName: string;
      FormattedName: string;
      ConfidenceScore: number;
    };
    DateOfBirth: string | null;
    Gender: string;
    FatherName: string | null;
    MotherName: string | null;
    MaritalStatus: string | null;
    Nationality: string;
    LanguageKnown:
      | {
          Language: string;
          LanguageCode: string;
        }[]
      | null;
    UniqueID: string | null;
    LicenseNo: string | null;
    PassportDetail: {
      PassportNumber: string | null;
      DateOfExpiry: string | null;
      DateOfIssue: string | null;
      PlaceOfIssue: string | null;
    } | null;
    PanNo: string | null;
    VisaStatus: string | null;
    Email:
      | {
          EmailAddress: string;
          ConfidenceScore: number;
        }[]
      | null;
    PhoneNumber:
      | {
          Number: string;
          ISDCode: string | null;
          OriginalNumber: string;
          FormattedNumber: string;
          Type: string;
          ConfidenceScore: number;
        }[]
      | null;
    WebSite:
      | {
          Type: string;
          Url: string;
        }[]
      | null;
    Address:
      | {
          Street: string | null;
          City: string | null;
          State: string | null;
          StateIsoCode: string | null;
          Country: string;
          CountryCode: {
            IsoAlpha2: string;
            IsoAlpha3: string;
            UNCode: string;
          };
          ZipCode: string | null;
          FormattedAddress: string;
          Type: string;
          ConfidenceScore: number;
        }[]
      | null;
    Category: string;
    SubCategory: string;
    CurrentSalary: {
      Amount: string | null;
      Symbol: string | null;
      Currency: string | null;
      Unit: string | null;
      Text: string;
    } | null;
    ExpectedSalary: {
      Amount: string | null;
      Symbol: string | null;
      Currency: string | null;
      Unit: string | null;
      Text: string;
    } | null;
    Qualification: string | null;
    SegregatedQualification:
      | {
          Institution: {
            Name: string;
            Type: string;
            ConfidenceScore: number;
            Location: {
              City: string | null;
              State: string | null;
              StateIsoCode: string | null;
              Country: string;
              CountryCode: {
                IsoAlpha2: string;
                IsoAlpha3: string;
                UNCode: string;
              };
            } | null;
          };
          SubInstitution: {
            Name: string;
            Type: string | null;
            ConfidenceScore: number;
            Location: {
              City: string | null;
              State: string | null;
              StateIsoCode: string | null;
              Country: string;
              CountryCode: {
                IsoAlpha2: string;
                IsoAlpha3: string;
                UNCode: string;
              };
            };
          } | null;
          Degree: {
            DegreeName: string;
            NormalizeDegree: string | null;
            Specialization: string[] | null;
            ConfidenceScore: number;
          } | null;
          FormattedDegreePeriod: string | null;
          StartDate: string | null;
          EndDate: string | null;
          Aggregate: {
            Value: string;
            MeasureType: string;
          };
        }[]
      | null;
    Certification: string | null;
    SegregatedCertification:
      | {
          CertificationTitle: string;
          Authority: string | null;
          CertificationCode: string | null;
          IsExpiry: string | null;
          StartDate: string | null;
          EndDate: string | null;
          CertificationUrl: string | null;
        }[]
      | null;
    SkillBlock: string;
    SkillKeywords: string;
    SegregatedSkill: {
      Type: string;
      Skill: string;
      Ontology: string | null;
      Alias: string | null;
      FormattedName: string;
      Evidence: string;
      LastUsed: string;
      ExperienceInMonths: number;
    }[];
    Experience: string;
    SegregatedExperience: {
      Employer: {
        EmployerName: string;
        FormattedName: string;
        ConfidenceScore: number;
      };
      JobProfile: {
        Title: string;
        FormattedName: string;
        Alias: string | null;
        RelatedSkills:
          | {
              Skill: string;
              ProficiencyLevel: string;
            }[]
          | null;
        ConfidenceScore: number;
      };
      Location: {
        City: string | null;
        State: string | null;
        StateIsoCode: string | null;
        Country: string | null;
        CountryCode: {
          IsoAlpha2: string;
          IsoAlpha3: string;
          UNCode: string;
        };
      };
      JobPeriod: string | null;
      FormattedJobPeriod: string | null;
      StartDate: string | null;
      EndDate: string | null;
      IsCurrentEmployer: string | null;
      JobDescription: string | null;
      Projects:
        | {
            UsedSkills: string | null;
            ProjectName: string | null;
            TeamSize: string | null;
          }[]
        | null;
    }[];
    CurrentEmployer: string | null;
    JobProfile: string | null;
    WorkedPeriod: {
      TotalExperienceInMonths: string;
      TotalExperienceInYear: string;
      TotalExperienceRange: string;
    } | null;
    GapPeriod: string | null;
    AverageStay: string | null;
    LongestStay: string | null;
    Summary: string;
    ExecutiveSummary: string;
    ManagementSummary: string;
    Coverletter: string | null;
    Publication: string | null;
    SegregatedPublication:
      | {
          PublicationTitle: string;
          Publisher: string | null;
          PublicationNumber: string | null;
          PublicationUrl: string | null;
          Authors: string | null;
          Description: string;
        }[]
      | null;
    CurrentLocation:
      | {
          City: string | null;
          State: string | null;
          StateIsoCode: string | null;
          Country: string;
          CountryCode: {
            IsoAlpha2: string;
            IsoAlpha3: string;
            UNCode: string;
          };
        }[]
      | null;
    PreferredLocation:
      | {
          City: string | null;
          State: string | null;
          StateIsoCode: string | null;
          Country: string;
          CountryCode: {
            IsoAlpha2: string;
            IsoAlpha3: string;
            UNCode: string;
          };
        }[]
      | null;
    Availability: string | null;
    Hobbies: string | null;
    Objectives: string | null;
    Achievements: string | null;
    SegregatedAchievement:
      | {
          AwardTitle: string;
          Issuer: string | null;
          AssociatedWith: string | null;
          IssuingDate: string | null;
          Description: string | null;
        }[]
      | null;
    References: string | null;
    CustomFields: string | null;
    EmailInfo: {
      EmailTo: string | null;
      EmailBody: string | null;
      EmailReplyTo: string | null;
      EmailSignature: string | null;
      EmailFrom: string | null;
      EmailSubject: string | null;
      EmailCC: string | null;
    } | null;
    Recommendations:
      | {
          PersonName: string;
          CompanyName: string;
          Relation: string | null;
          PositionTitle: string;
          Description: string | null;
        }[]
      | null;
    DetailResume: string | null;
    HtmlResume: string | null;
    CandidateImage: {
      CandidateImageData: string;
      CandidateImageFormat: string;
    } | null;
    TemplateOutput: {
      TemplateOutputFileName: string | null;
      TemplateOutputData: string | null;
    } | null;
    ApiInfo: {
      Metered: string | null;
      CreditLeft: string | null;
      AccountExpiryDate: string | null;
      BuildVersion: string | null;
    } | null;
  };
  ResumeQuality:
    | {
        Level: string | null;
        Findings:
          | {
              QualityCode: string | null;
              SectionIdentifiers:
                | {
                    SectionType: string;
                    Id: string;
                  }[]
                | null;
              Message: string | null;
            }[]
          | null;
      }[]
    | null;
}
