resource "random_id" "main" {
  byte_length = 2
  prefix      = "translation-api-${local.environment_name}-"
}

resource "google_project_service" "service" {
  for_each = toset([
    "endpoints.googleapis.com",
    "run.googleapis.com",
    "servicecontrol.googleapis.com",
    "servicemanagement.googleapis.com",
  ])

  service = each.key

  project                    = data.terraform_remote_state.holi_infra_state.outputs.shared_project_id
  disable_dependent_services = false
  disable_on_destroy         = false
}

variable "image_tag" {
  type     = string
  nullable = false
}

resource "google_cloud_run_service" "translation_api" {
  project                    = data.terraform_remote_state.holi_infra_state.outputs.shared_project_id
  name                       = random_id.main.hex
  location                   = local.default_region
  autogenerate_revision_name = true

  template {
    spec {
      service_account_name = data.terraform_remote_state.holi_translation_api_common_state.outputs.cloud_run_service_account_email
      containers {
        image = "${data.terraform_remote_state.holi_infra_state.outputs.artifact_registry_location}/holi-translation-api:${var.image_tag}"
        ports {
          container_port = 8089
        }

        env {
          name  = "ENVIRONMENT"
          value = local.environment
        }

        env {
          name  = "HOLI_LIBRETRANSLATE_BASE_URL"
          value = local.environment == "production" ? "https://staging.libretranslate.apis.holi.social" : "https://production.libretranslate.apis.holi.social"
        }

        resources {
          limits = {
            cpu    = local.environment == "production" ? "1000m" : "1000m"
            memory = local.environment == "production" ? "512Mi" : "256Mi"
          }
          requests = {
            cpu    = local.environment == "production" ? "1000m" : "1000m"
            memory = local.environment == "production" ? "512Mi" : "256Mi"
          }
        }
      }
      container_concurrency = 0
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"        = local.environment == "production" ? "1" : "0"
        "autoscaling.knative.dev/maxScale"        = local.environment == "production" ? "10" : "1"
        "run.googleapis.com/vpc-access-connector" = data.terraform_remote_state.holi_infra_state.outputs.vpc_access_connector_name
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }
  }

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "internal"
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.service]
}

resource "google_cloud_run_domain_mapping" "holi_social_translation_api" {
  project  = google_cloud_run_service.translation_api.project
  location = google_cloud_run_service.translation_api.location
  name     = local.dns_name

  metadata {
    namespace = google_cloud_run_service.translation_api.project
  }

  spec {
    route_name = google_cloud_run_service.translation_api.name
  }
}

data "google_iam_policy" "translation_api" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "translation_api" {
  location = google_cloud_run_service.translation_api.location
  project  = google_cloud_run_service.translation_api.project
  service  = google_cloud_run_service.translation_api.name

  policy_data = data.google_iam_policy.translation_api.policy_data
}
