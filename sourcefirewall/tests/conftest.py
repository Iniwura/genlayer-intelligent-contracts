"""Studio Dev direct-mode harness for the pinned CanaryGate runtime."""

from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any

import gltest.direct.loader as direct_loader
from gltest.direct.vm import VMContext, _sentinel


STUDIO_DEV_RUNNER_HASH = "1zr6nqk597d97kg0dyxg0shhrykx5v02zjgnyrajapy4wlqvfvwh"
STUDIO_DEV_CACHE = Path.home() / ".cache" / "genvm-linter" / "extracted" / "v0.3.0-rc7.tar"


def _inject_message(vm: VMContext) -> None:
    from genlayer import calldata
    from genlayer.types import Address

    def address(value: Any) -> Address:
        if value is None:
            return Address(b"\x00" * Address.SIZE)
        if isinstance(value, Address):
            return value
        if isinstance(value, bytes):
            return Address(value)
        if hasattr(value, "as_bytes"):
            return Address(value.as_bytes)
        return Address(value)

    sender = address(vm.sender)
    contract = address(vm._contract_address)
    origin = address(vm.origin)
    encoded = calldata.encode(
        {
            "contract_address": contract,
            "sender_address": sender,
            "origin_address": origin,
            "signer_address": sender,
            "stack": [],
            "value": vm._value,
            "datetime": vm._datetime,
            "is_init": False,
            "chain_id": vm._chain_id,
            "entry_kind": 0,
            "entry_data": b"",
            "entry_stage_data": None,
        }
    )
    fd, path = tempfile.mkstemp()
    try:
        os.write(fd, encoded)
        os.lseek(fd, 0, os.SEEK_SET)
        vm._original_stdin_fd = os.dup(0)
        os.dup2(fd, 0)
    finally:
        os.close(fd)
        try:
            os.unlink(path)
        except PermissionError:
            pass


def _allocate_contract(contract_cls: type, vm: VMContext, *args: Any, **kwargs: Any) -> Any:
    from genlayer.storage import ROOT_SLOT_ID
    from genlayer.storage._internal.generate import (
        ORIGINAL_INIT_ATTR,
        _BuilderCtx,
        _storage_build,
    )

    descriptor = _storage_build(_BuilderCtx.empty(), contract_cls)
    instance = descriptor.get(vm._storage.get_store_slot(ROOT_SLOT_ID), 0)
    owner = getattr(descriptor, "cls", None)
    init = getattr(owner, "__init__", None) if owner is not None else getattr(contract_cls, "__init__", None)
    if init is not None:
        if hasattr(init, ORIGINAL_INIT_ATTR):
            init = getattr(init, ORIGINAL_INIT_ATTR)
        init(instance, *args, **kwargs)
    return instance


def _run_nondet(leader_fn, validator_fn, /, **kwargs):
    from gltest.direct import wasi_mock
    from genlayer import vm as gl_vm

    vm = wasi_mock.get_vm()
    vm._in_nondet = True
    try:
        result = leader_fn()
    finally:
        vm._in_nondet = False
    vm._captured_validators.append((result, leader_fn, validator_fn))
    vm._in_nondet = True
    try:
        accepted = validator_fn(gl_vm.Return(calldata=result))
    finally:
        vm._in_nondet = False
    if type(accepted) is not bool or not accepted:
        raise RuntimeError("Direct Mode validator rejected nondeterministic result")
    return result


def _run_nondet_lazy(leader_fn, validator_fn, /, **kwargs):
    from genlayer.types import Lazy

    return Lazy(lambda: _run_nondet(leader_fn, validator_fn, **kwargs))


_run_nondet.lazy = _run_nondet_lazy


def _refresh_message(self: VMContext) -> None:
    if "genlayer.message" not in sys.modules:
        return
    from genlayer.types import Address

    def address(value: Any) -> Any:
        if value is None or isinstance(value, Address):
            return value
        if isinstance(value, bytes):
            return Address(value)
        if hasattr(value, "as_bytes"):
            return Address(value.as_bytes)
        return value

    message = sys.modules["genlayer.message"]
    message.sender_address = address(self.sender)
    message.origin_address = address(self.origin)
    message.value = self._value
    message.chain_id = self._chain_id
    message.datetime = self._datetime
    if isinstance(getattr(message, "raw", None), dict):
        message.raw.update(
            sender_address=address(self.sender),
            origin_address=address(self.origin),
            value=self._value,
            chain_id=self._chain_id,
            datetime=self._datetime,
        )


def _run_validator(self: VMContext, *, leader_result: Any = _sentinel, leader_error: Exception | None = None, index: int = -1) -> bool:
    from genlayer import vm as gl_vm

    if not self._captured_validators:
        raise RuntimeError("No validator captured.")
    stored_result, _leader_fn, validator_fn = self._captured_validators[index]
    if leader_error is not None:
        wrapped = gl_vm.UserError(str(leader_error))
    elif leader_result is not _sentinel:
        wrapped = gl_vm.Return(calldata=leader_result)
    else:
        wrapped = gl_vm.Return(calldata=stored_result)
    return validator_fn(wrapped)


direct_loader._inject_message_to_fd0 = _inject_message
direct_loader._allocate_contract = _allocate_contract
direct_loader._patch_run_nondet_for_direct_mode = lambda: _install_patches()
VMContext._refresh_gl_message = _refresh_message
VMContext.run_validator = _run_validator

_original_load_module = direct_loader._load_module


def _load_module_with_reset(contract_path: Path):
    import genlayer.contract as current_contract

    current_contract.__known_contract__ = None
    return _original_load_module(contract_path)


direct_loader._load_module = _load_module_with_reset


def _setup_cached_paths(contract_path: Path, sdk_version: str | None = None):
    runner = STUDIO_DEV_CACHE / "py-genlayer" / STUDIO_DEV_RUNNER_HASH
    standard_hash = "10pqy9vk4a8w8pg25py83s23k3mjjy7dwpdqjvqggb9ms7ycipvh"
    standard = STUDIO_DEV_CACHE / "py-lib-genlayer-std" / standard_hash
    paths = [runner, standard]
    for path in reversed(paths):
        import_path = path / "src" if (path / "src").exists() else path
        if str(import_path) not in sys.path:
            sys.path.insert(0, str(import_path))
    return paths


def _install_cached_loader() -> None:
    import gltest.direct.sdk_loader as sdk_loader

    sdk_loader.setup_sdk_paths = _setup_cached_paths


_install_cached_loader()


def _install_patches() -> None:
    from gltest.direct import wasi_mock
    import genlayer.nondet as nondet
    import genlayer.nondet.web as web
    import genlayer.vm as vm

    vm.run_nondet = _run_nondet

    def exec_prompt(prompt: str, /, **config):
        active_vm = wasi_mock.get_vm()
        response = active_vm._match_llm_mock(prompt)
        if response is None:
            raise RuntimeError("No LLM mock configured")
        return response

    def request(url: str, /, *, method: str, body=None, headers=None, sign=False):
        from genlayer.nondet.web import Response

        active_vm = wasi_mock.get_vm()
        mock = active_vm._match_web_mock(url, method)
        if mock is None:
            raise RuntimeError("No web mock configured")
        raw_body = mock.get("body", b"")
        if isinstance(raw_body, str):
            raw_body = raw_body.encode("utf-8")
        return Response(
            status=mock.get("status", 200),
            headers={},
            body=raw_body,
        )

    nondet.exec_prompt = exec_prompt
    web.request = request

    def render(url: str, /, **kwargs):
        active_vm = wasi_mock.get_vm()
        mock = active_vm._match_web_mock(url, "GET")
        if mock is None:
            raise RuntimeError("No web mock configured")
        raw_body = mock.get("body", b"")
        if isinstance(raw_body, bytes):
            return raw_body.decode("utf-8")
        return str(raw_body)

    web.render = render

    def spawn_sandbox(fn, **kwargs):
        return vm.Return(calldata=fn())

    vm.spawn_sandbox = spawn_sandbox



