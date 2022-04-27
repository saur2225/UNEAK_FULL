const slug = document.getElementById("slug");
const message = document.getElementById("message");

const validate = () => {
  message.textContent = "Please Wait...";
  message.style.color = "red";
  fetch("/validate?slug=" + slug.value).then((response) => {
    response.json().then((data) => {
      message.textContent = data.message;
      message.style.color = data.color;
    });
  });
};
