export interface SettingsValidationIssue {
  field: string;
  message: string;
}

export interface SettingsValidationResult {
  valid: boolean;
  issues: SettingsValidationIssue[];
  warnings: string[];
}
