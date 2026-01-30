/**
 * Patient entity representing a user from Semble CRM.
 */
export interface Patient {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  gender?: string;
  address?: {
    line1?: string;
    city?: string;
    postcode?: string;
  };
  phones?: Array<{
    type: string;
    number: string;
  }>;
}
