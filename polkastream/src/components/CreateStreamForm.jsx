export default function CreateStreamForm({
  recipient,
  setRecipient,
  amountToken,
  setAmountToken,
  durationSeconds,
  setDurationSeconds,
  onSubmit,
}) {
  return (
    <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
      <label className="col-span-1 sm:col-span-2">
        <span className="block text-sm text-white/70">Recipient (H160 Address)</span>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
          required
        />
      </label>

      <label>
        <span className="block text-sm text-white/70">Total Amount (PAS)</span>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
          value={amountToken}
          onChange={(e) => setAmountToken(e.target.value)}
          placeholder="10.0"
          required
        />
      </label>

      <label>
        <span className="block text-sm text-white/70">Duration (seconds)</span>
        <input
          type="number"
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
          value={durationSeconds}
          onChange={(e) => setDurationSeconds(e.target.value)}
          placeholder="3600"
          min={1}
          required
        />
      </label>

      <div className="sm:col-span-2">
        <button className="btn-primary w-full sm:w-auto" type="submit" aria-label="Start money stream">
          Start Streaming
        </button>
      </div>
    </form>
  );
}