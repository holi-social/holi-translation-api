resource "google_service_account" "translation_api" {
  project      = data.terraform_remote_state.holi_infra_state.outputs.shared_project_id
  account_id   = "cloudrun-service-translation-api"
  display_name = "translation API service account for Cloud Run"
}

resource "google_project_iam_member" "translation_api" {
  project = data.terraform_remote_state.holi_infra_state.outputs.shared_project_id
  member  = "serviceAccount:${google_service_account.translation_api.email}"
  role    = "roles/secretmanager.secretAccessor"
}

output "cloud_run_service_account_email" {
  value = google_service_account.translation_api.email
}
