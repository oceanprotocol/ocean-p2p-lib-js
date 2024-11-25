import { Stream } from "stream"

export interface P2PStatusResponse {
    httpStatus: number
    error?: string
    headers?: any
  }
  export interface P2PCommandResponse {
    status: P2PStatusResponse
    stream: Stream | null
  }
  