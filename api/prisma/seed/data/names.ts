// O'zbekcha ismlar (oʻ/gʻ — U+02BB). Familiyalar erkak shaklida; ayol shakli: -ov → -ova, -ev → -eva.

export const MALE = [
  "Aziz", "Bobur", "Doston", "Eldor", "Farrux", "Hasan", "Husan", "Islom", "Javohir", "Jamshid", "Kamron", "Laziz",
  "Mirjalol", "Nodir", "Oybek", "Shohruh", "Xurshid", "Yusuf", "Zafar", "Abdulloh", "Akmal", "Anvar", "Behruz",
  "Diyor", "Ibrohim", "Muhammadali", "Nurbek", "Ozod", "Samandar", "Ulugʻbek", "Asilbek", "Ravshan", "Sarvar",
  "Firdavs", "Mansur", "Ilhom", "Jasurbek", "Otabek", "Shoxruh", "Sanjarbek", "Umidjon", "Boburjon", "Humoyun",
  "Abbos", "Alisher", "Axror", "Bekzod", "Dilmurod", "Elyor", "Gʻayrat", "Jahongir", "Komil", "Lochin", "Murod",
  "Nurmuhammad", "Orzubek", "Rustam", "Saidakbar", "Temur", "Oʻktam", "Shahboz", "Zohid",
] as const;

export const FEMALE = [
  "Aziza", "Barno", "Dildora", "Durdona", "Feruza", "Gulnora", "Hilola", "Iroda", "Laylo", "Madina", "Mohinur",
  "Nigina", "Nozima", "Oydin", "Rayhona", "Robiya", "Sabina", "Sarvinoz", "Shahlo", "Shahzoda", "Sitora", "Umida",
  "Xadicha", "Yulduz", "Zilola", "Mubina", "Munisa", "Charos", "Dilnoza", "Gulasal", "Maftuna", "Marjona",
  "Nilufar", "Ozoda", "Sevinch", "Soliha", "Zuhra", "Asal", "Muslima", "Oʻgʻiloy", "Gulbahor", "Kamila", "Lobar",
  "Mahliyo", "Nafisa", "Parizoda", "Ruxshona", "Sabrina", "Shoira", "Zarnigor",
] as const;

export const SURNAMES = [
  "Abdullayev", "Ahmedov", "Alimov", "Aminov", "Azimov", "Bakirov", "Boboyev", "Davletov", "Fayzullayev", "Gʻaniyev",
  "Hakimov", "Hamidov", "Ibragimov", "Jalilov", "Jumayev", "Kamolov", "Latipov", "Mahmudov", "Mirzayev", "Musayev",
  "Normatov", "Oripov", "Otajonov", "Poʻlatov", "Rasulov", "Salimov", "Sobirov", "Sultonov", "Tojiyev", "Toshmatov",
  "Turgʻunov", "Usmonov", "Yoʻldoshev", "Zokirov", "Shodiyev", "Sharipov", "Hasanov", "Mamatqulov", "Eshonqulov",
  "Rixsiyev", "Qurbonov", "Nurmatov", "Xoliqov", "Sodiqov", "Ergashev", "Tursunov", "Yunusov", "Nazarov", "Umarov",
  "Rahmonov", "Gʻofurov", "Isroilov", "Majidov", "Abduqodirov", "Karimberdiyev",
] as const;

export const femaleSurname = (s: string) => (/(ov|ev)$/.test(s) ? `${s}a` : s);
export const maleSurname = (s: string) => s.replace(/(ov|ev)a$/, "$1");
