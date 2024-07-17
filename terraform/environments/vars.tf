locals {
  environment      = terraform.workspace
  environment_name = trim(substr(local.environment, 0, 22), ".-")
  dns_name         = "${trimsuffix(substr(local.environment, 0, 34), ".-")}.${data.terraform_remote_state.holi_translation_api_common_state.outputs.dns_translation_api_domain}"
  default_region   = data.terraform_remote_state.holi_infra_state.outputs.default_region
}
