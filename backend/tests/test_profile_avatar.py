import io

from PIL import Image

from tests.conftest import register_citizen


def citizen_headers(client, **overrides):
    response = register_citizen(client, **overrides)
    return {"Authorization": f"Bearer {response.get_json()['data']['token']}"}


def image_upload(name="avatar.jpg", image_format="JPEG"):
    stream = io.BytesIO()
    Image.new("RGB", (32, 32), "blue").save(stream, format=image_format)
    stream.seek(0)
    return {"avatar": (stream, name)}


def test_citizen_can_upload_and_remove_own_avatar(client):
    headers = citizen_headers(client)

    upload = client.post(
        "/api/profile/avatar", data=image_upload(), headers=headers, content_type="multipart/form-data"
    )
    assert upload.status_code == 200
    avatar_url = upload.get_json()["data"]["user"]["avatar_url"]
    assert avatar_url.startswith("/static/avatars/user")
    assert client.get(avatar_url).status_code == 200

    removed = client.delete("/api/profile/avatar", headers=headers)
    assert removed.status_code == 200
    assert removed.get_json()["data"]["user"]["avatar_url"] is None


def test_replacing_avatar_removes_the_previous_file(client):
    headers = citizen_headers(client, phone="+252634000097", email="replace.avatar@example.com")

    first = client.post(
        "/api/profile/avatar", data=image_upload(), headers=headers, content_type="multipart/form-data"
    )
    first_url = first.get_json()["data"]["user"]["avatar_url"]

    second = client.post(
        "/api/profile/avatar", data=image_upload(), headers=headers, content_type="multipart/form-data"
    )
    second_url = second.get_json()["data"]["user"]["avatar_url"]

    assert second_url != first_url
    assert client.get(first_url).status_code == 404
    assert client.get(second_url).status_code == 200


def test_avatar_requires_authentication_and_valid_image(client):
    unauthenticated = client.post(
        "/api/profile/avatar", data=image_upload(), content_type="multipart/form-data"
    )
    assert unauthenticated.status_code == 401

    headers = citizen_headers(client, phone="+252634000098", email="other.avatar@example.com")
    invalid = client.post(
        "/api/profile/avatar",
        data={"avatar": (io.BytesIO(b"not an image"), "avatar.jpg")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert invalid.status_code == 422
    assert invalid.get_json()["errors"]["avatar"] == "Invalid image file."