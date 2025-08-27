use crate::libs::{db::AppState, error::ApiError};

pub async fn health(State(AppState { pool }) : State<AppState>,
) -> Result<Json<_>, ApiError> {
Ok(Json( ))}