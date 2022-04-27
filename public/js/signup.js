const validate=()=>{
    const email=document.getElementById('email').value
    const password=document.getElementById('password').value
    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if(reg.test(email)==false)
    {
        alert('Invalid Email Address')
        return false
    }

    if(password.length<=6||password.includes('password'))
    {
        alert('Password Length Must Be Greater Than 6 and Must not Include password')
        return false
    }

}