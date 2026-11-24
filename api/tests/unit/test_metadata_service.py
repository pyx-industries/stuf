import pytest

from api.domain import FileMetadataService, ReservedMetadataError


def _create(user_metadata):
    return FileMetadataService.create_upload_metadata(
        uploader="alice",
        upload_time="20240101-000000",
        collection="docs",
        original_filename="a.txt",
        user_metadata=user_metadata,
    )


@pytest.mark.unit
class TestReservedMetadata:
    @pytest.mark.parametrize(
        "field", ["uploader", "upload_time", "collection", "original_filename"]
    )
    def test_reserved_field_is_rejected(self, field):
        with pytest.raises(ReservedMetadataError, match=field):
            _create({field: "spoofed"})

    def test_other_fields_are_kept(self):
        assert _create({"description": "x"})["description"] == "x"

    @pytest.mark.parametrize("key", ["Uploader", "x-amz-meta-uploader"])
    def test_reserved_field_spelling_variants_are_rejected(self, key):
        with pytest.raises(ReservedMetadataError):
            _create({key: "spoofed"})

    @pytest.mark.parametrize("value", ["[1]", '"text"', "5"])
    def test_non_object_json_is_not_a_dict(self, value):
        assert FileMetadataService.parse_metadata_json(value) == {}
