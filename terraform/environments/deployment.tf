resource "random_id" "main" {
  byte_length = 2
  prefix      = "translation-api-${local.environment_name}-"
}

resource "google_project_service" "service" {
  for_each = toset([
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

resource "google_cloud_run_v2_service" "translation_api_service" {
  project  = data.terraform_remote_state.holi_infra_state.outputs.shared_project_id
  name     = random_id.main.hex
  location = local.default_region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = data.terraform_remote_state.holi_translation_api_common_state.outputs.cloud_run_service_account_email
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
        value = local.environment == "production" ? "https://production.libretranslate.apis.holi.social" : "https://staging.libretranslate.apis.holi.social"
      }

      env {
        name  = "REDIS_HOST"
        value = data.terraform_remote_state.holi_infra_state.outputs.redis_host_cmek_development
      }
      env {
        name  = "REDIS_PORT"
        value = data.terraform_remote_state.holi_infra_state.outputs.redis_port_cmek_development
      }
      env {
        name = "REDIS_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = "REDIS_CMEK_PASSWORD"
            version = "latest"

          }
        }
      }
      env {
        name  = "REDIS_DB"
        value = "10"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = local.environment == "production" ? "1" : "0"
      max_instance_count = local.environment == "production" ? "10" : "1"
    }

    vpc_access {
      connector = "projects/${data.terraform_remote_state.holi_infra_state.outputs.shared_project_id}/locations/${local.default_region}/connectors/${data.terraform_remote_state.holi_infra_state.outputs.vpc_access_connector_name}"
      egress    = "ALL_TRAFFIC"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [google_project_service.service]
}

resource "google_cloud_run_domain_mapping" "holi_social_translation_api" {
  project  = google_cloud_run_v2_service.translation_api_service.project
  location = google_cloud_run_v2_service.translation_api_service.location
  name     = local.dns_name

  metadata {
    namespace = google_cloud_run_v2_service.translation_api_service.project
  }

  spec {
    route_name = google_cloud_run_v2_service.translation_api_service.name
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

resource "google_cloud_run_v2_service_iam_policy" "translation_api" {
  name        = google_cloud_run_v2_service.translation_api_service.name
  location    = google_cloud_run_v2_service.translation_api_service.location
  project     = google_cloud_run_v2_service.translation_api_service.project
  policy_data = data.google_iam_policy.translation_api.policy_data
}
