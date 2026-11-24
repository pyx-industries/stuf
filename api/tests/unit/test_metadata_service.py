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
