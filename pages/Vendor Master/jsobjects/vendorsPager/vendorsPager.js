export default {
	page: 1,

	pageSize: 10,

	inviteVendor: async function () {
			const inv = (vendorMasterWidget.model && vendorMasterWidget.model.newInvite) || {};
			const res = await fetch("/api/v1/safal/webhook/jewelex-int-create-case-dev", {
				method: "POST", headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					vendor_working_name: inv.vendorName, vendor_contact_email: inv.vendorEmail, company_name: inv.company_name,
					party_type: inv.party_type, category: inv.category, service_supplier: inv.service_supplier === true
				})
			});
			let body = null;
			try { body = await res.json(); } catch (e) { body = null; }
			if (!res.ok || !body || !body.ok) throw new Error((body && body.message) || ("Invitation failed (HTTP " + res.status + ")"));
			return body;
	}
}
