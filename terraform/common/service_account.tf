resource "google_service_account" "translation_api" {
  project      = data.terraform_remote_state.holi_infra_state.outputs.shared_project_id
  account_id   = "holi-translation-api"
  display_name = "Translation API service account for Cloud Run"
}

output "cloud_run_service_account_email" {
  value = google_service_account.translation_api.email
}
