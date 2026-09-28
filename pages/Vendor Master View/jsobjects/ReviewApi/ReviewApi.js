export default {
	decide: async function () {
			const req = (Custom1.model && Custom1.model.financeDecisionRequest) || {};
			const res = await fetch("/api/v1/safal/webhook/jewelex-fin-decision", {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req)
			});
			let body = null;
			try { body = await res.json(); } catch (e) { body = null; }
			if (!res.ok || !body || body.ok === false || body.status === "failed") {
				throw new Error((body && body.message) || ("Decision failed (HTTP " + res.status + ")"));
			}
			return body;
	}
}
