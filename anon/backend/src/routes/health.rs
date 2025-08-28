use axum::{extract::State, Json};
use serde::Serialize;
use crate::libs::{db::AppState, error::ApiError};

#[derive(Serialize)]
pub struct HealthResponse { pub status: &'static str }

pub async fn health(
    State(AppState { .. }) : State<AppState>,
) -> Result<Json<HealthResponse>, ApiError> {
    Ok(Json(HealthResponse { status: "ok" }))
}