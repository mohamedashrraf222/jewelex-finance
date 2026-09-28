export default {
	base: "/api/v1/safal/webhook/",

	paths: {
		masters: "wf_fin_cfg_get_pr_masters",
		company: "wf_fin_cfg_save_company_unit",
		department: "wf_fin_cfg_save_department",
		category: "wf_fin_cfg_save_category",
		authority: "wf_fin_cfg_save_approval_authority",
		stage: "wf_fin_cfg_save_notification_stage",
		kycGet: "wf_fin_cfg_get_kyc_config",
		kycSave: "wf_fin_cfg_save_variant_requirements",
		kycLabel: "wf_fin_cfg_update_kyc_label"
	},

	post: async function (key, body) {
			const res = await fetch(AdminConfigApi.base + AdminConfigApi.paths[key], {
				method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {})
			});
			let json = null;
			try { json = await res.json(); } catch (e) { json = null; }
			if (res.ok && json && json.ok) return json;
			const raw = (json && (json.message || json.errorDisplay)) || ("HTTP " + res.status);
			const m = /\b([A-Z][A-Z_]{2,}):\s*([^{[]*)/.exec(raw);
			throw { code: m ? m[1] : "REQUEST_FAILED", message: m ? m[2].trim() : raw };
	},

	loadMasters: async function () {
			const r = await AdminConfigApi.post("masters", {});
			await storeValue("acMasters", Object.assign({}, r, { loadedAt: Date.now() + Math.random() }));
	},

	loadKyc: async function (variantKey) {
			const r = await AdminConfigApi.post("kycGet", { variant_key: variantKey || "LOCAL|RM" });
			await storeValue("acKyc", Object.assign({}, r, { loadedAt: Date.now() + Math.random() }));
	},

	onPageLoad: async function () {
			const kyc = (appsmith.store.acKyc && appsmith.store.acKyc.variant && appsmith.store.acKyc.variant.key) || "LOCAL|RM";
			try {
				await Promise.all([AdminConfigApi.loadMasters(), AdminConfigApi.loadKyc(kyc)]);
			} catch (e) {
				await storeValue("acLoadError", { code: e.code || "REQUEST_FAILED", message: e.message || String(e), ts: Date.now() + Math.random() });
			}
	},

	run: async function () {
			const cmd = (Custom1.model && Custom1.model.command) || {};
			const result = { id: cmd.id || null, ts: Date.now() + Math.random() };
			try {
				const p = Object.assign({}, cmd.payload || {}, { actor_email_claimed: appsmith.user.email, request_id: cmd.id });
				let data = null;
				switch (cmd.action) {
					case "reload":
						await AdminConfigApi.loadMasters();
						await AdminConfigApi.loadKyc(p.variant_key);
						break;
					case "kycLoad":
						await AdminConfigApi.loadKyc(p.variant_key);
						break;
					case "company": case "department": case "category": case "authority": case "stage":
						data = await AdminConfigApi.post(cmd.action, p);
						await AdminConfigApi.loadMasters();
						break;
					case "kycPreview":
						data = await AdminConfigApi.post("kycSave", Object.assign(p, { dry_run: true }));
						break;
					case "kycSave":
						data = await AdminConfigApi.post("kycSave", Object.assign(p, { dry_run: false }));
						await AdminConfigApi.loadKyc(p.variant_key);
						break;
					case "kycLabel":
						data = await AdminConfigApi.post("kycLabel", p);
						await AdminConfigApi.loadKyc(p.variant_key);
						break;
					default:
						throw { code: "INVALID_REQUEST", message: "Unknown command " + cmd.action };
				}
				result.ok = true;
				result.data = data;
			} catch (e) {
				result.ok = false;
				result.error = { code: e.code || "REQUEST_FAILED", message: e.message || String(e) };
			}
			await storeValue("acResult", result);
	}
}
