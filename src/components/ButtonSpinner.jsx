/**
 * Inline spinner shown inside buttons during loading state.
 * Usage: <ButtonSpinner /> inside any button when loading=true
 */
export default function ButtonSpinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "15px",
        height: "15px",
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "btn-spin 0.65s linear infinite",
        flexShrink: 0
      }}
    />
  );
}
