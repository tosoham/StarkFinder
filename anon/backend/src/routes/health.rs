use crate::libs::{db::AppState, error::ApiError};
use axum::extract::State;
use axum::Json;

pub async fn health(State(AppState { pool }) : State<AppState>,
) -> Result<Json<()>, ApiError> {
Ok(Json(()))}