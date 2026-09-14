import unittest
from pathlib import Path

from deep_tests.upgrade_model import IncompatibleChange, assert_non_destructive_required_change, negotiate, read_with_version


class CounterpartTipUpgradeHardeningTests(unittest.TestCase):
    def test_negotiation_is_order_independent(self) -> None:
        self.assertEqual(negotiate([3, 1, 2], [4, 3, 2]), 3)
        self.assertEqual(negotiate([2, 3, 1], [3, 4, 2]), 3)

    def test_old_reader_does_not_leak_future_fields(self) -> None:
        record = {
            "version": 3,
            "id": "entity-a",
            "display_name": "one",
            "metadata": {"labels": ["protected"]},
            "status": "active",
            "future_field": {"must_not_leak": True},
        }
        projected = read_with_version(record, 1)
        self.assertEqual(projected, {"id": "entity-a", "name": "one"})
        self.assertNotIn("future_field", projected)

    def test_required_field_removal_fails_closed(self) -> None:
        with self.assertRaises(IncompatibleChange):
            assert_non_destructive_required_change({"id", "name", "status"}, {"id", "name"})

    def test_zed_pkg_test_script_keeps_discovery_and_verifier(self) -> None:
        text = Path(".zpkg.toml").read_text()
        self.assertIn("unittest discover", text)
        self.assertIn("verify_repository.py", text)


if __name__ == "__main__":
    unittest.main()
