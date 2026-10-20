# v0.2.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import hashlib
import genlayer.gl as gl
from genlayer import Address, TreeMap, u256, allow_storage


class DownstreamAgent(gl.Contract):
    firewall_address: Address
    consumed_count: u256
    consumed_digests: TreeMap[str, bool]

    def __init__(self, firewall_address: str | Address):
        if not isinstance(firewall_address, Address):
            firewall_address = Address(firewall_address)
        self.firewall_address = firewall_address
        self.consumed_count = u256(0)

    @gl.public.write
    def consume_source(self, record_id: str, raw_payload: str) -> str:
        firewall = gl.get_contract_at(self.firewall_address)
        if not firewall.view().is_safe(record_id):
            raise gl.vm.UserError("FIREWALL_BLOCKED: source record is not certified safe")
        record = firewall.view().get_record(record_id)
        computed_digest = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()
        if computed_digest != record["source_digest"]:
            raise gl.vm.UserError("DIGEST_MISMATCH: payload bytes do not match firewall certified digest")
        self.consumed_digests[computed_digest] = True
        self.consumed_count = u256(int(self.consumed_count) + 1)
        return "CONSUMED: " + computed_digest

    @gl.public.view
    def get_consumed_count(self) -> u256:
        return self.consumed_count

    @gl.public.view
    def has_consumed_digest(self, digest: str) -> bool:
        return self.consumed_digests.get(digest, False)
