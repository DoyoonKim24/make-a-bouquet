import { useEffect, useState } from "react";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    fetch("http://localhost:8080/test-s3")
      .then((res) => res.json())
      .then((data) => {
        setImageUrl(data.firstImageUrl);
      });
  }, []);

  return (
    <div>
      {imageUrl ? <img src={imageUrl} alt="First S3 Object" /> : <p>No image found</p>}
    </div>
  );
}
