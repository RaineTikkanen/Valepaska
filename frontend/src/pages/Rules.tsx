
function Rules() {
  return (
    <div className="my-10 flex justify-center">
      <div className="flex w-full flex-col md:mx-20 2xl:w-300">
        <h1 className="text-4xl">Paskahousun säännöt</h1>
        <h2 className="mt-4 text-2xl">Pelin kulku</h2>
        <p className="mt-4">
          Paskahousu on korttipeli, jonka voittaa se, joka pääsee ensimmäisenä eroon kaikista korteistaan.
          Pelin alussa kaikille pelaajille jaetaan viisi korttia.
          Jokainen pelaaja vuorollaan asettaa kortteja pöydällä olevaan pelipakkaan. Saman arvoisia kortteja voi asettaa useampia kerralla. Esimerkiksi jos
          pelaajalla on kädessään kaksi seiskaa, hän voi pelata molemmat kerralla. Korttien maalla ei paskahousussa ole merkitystä. 
          Jos pelaajalla on kädessä alle viisi korttia vuoronsa jälkeen ja nostopakassa 
          on kortteja, hän nostaa käden &#34;täyteen&#34; viiteen korttiin.
          Seuraavan pelaajan on asetettava pöydälle kortti, 
          joka on arvoltaan samansuuruinen tai suurempi kuin edellisen pelaajan asettama kortti. Kuvakortteja voi pelata pöytään kuitenkin vasta siinä vaiheessa,
          kun pöydässä on seiska tai sitä suurempi kortti. Jos pelaaja ei pysty asettamaan korttia, hänen on nostettava pelipakka käteensä.
        </p>
        <h2 className="mt-4 text-2xl">Erikoiskortit</h2>
        <p className="mt-4">
          Paskahousussa on muutamia erikoiskortteja, jotka toimivat pelissä normaaleista korteista poikkeavasti. Näitä kortteja ovat:
          <ul className="mt-2 list-inside list-disc">
            <li><strong>Kakkonen:</strong> Kakkosen voi pelata minkä tahansa kortin päälle, mutta sen päälle voi pelata vain toisen kakkosen.</li>
            <li><strong>Kymppi:</strong> Kympit ovat erikoiskortteja joilla voi kaataa pelipakan poistopinoon, jos pöydässä on päällimmäisenä alle kympin arvoinen kortti 
              (Poislukien kakkonen. Kakkosen päälle voi pelata vain kakkosen).</li>
            <li><strong> Ässä:</strong> Kympit ovat erikoiskortteja joilla voi kaataa pelipakan poistopinoon, jos pöydässä on päällimmäisenä kuvakortti. </li>
          </ul>
        </p>
        <h2 className="mt-4 text-2xl">Valepaska?</h2>
        <p className="mt-4">
          Mutta sivun nimi on valepaska? Kyllä! Paskahousu on itsessään varsin tylsä ja ankea peli, mutta siitä on olemassa variantti nimeltä 
          <em className="ml-1">&#34;valepaska&#34;</em>, kaikkien korttipelien kuningas. Valepaska on kuin paskahousu, mutta kortit pelataan pöytään kuvapuoli alaspäin.
          Tämän jälkeen pelaaja kertoo mitä hän pöytään pelasi. 
          <em className="ml-1">&#34;Vale&#34;</em> -osio pelistä tulee siitä, että pelaaja voi valehdella siitä mitä kortteja hän pelasi. Määrää ei voi valehdella,
          mutta korttien arvon voi. Pelaaja voi siis esimerkiksi pelata pöytään kolmosen, vitosen ja kasin, mutta väittää pelanneensa kolme jätkää. 
          Kuka vain muista pelaajista voi halutessaan epäillä pelaajan väitettä. Tällöin hän kääntää pelatut kortit kuvapuoli ylöspäin. 
          Jos pelaaja valehteli, hänen on nostettava kaikki pöydällä olevat kortit käteensä. Jos pelaaja puhui totta, epäilijän on nostettava kaikki 
          pöydällä olevat kortit käteensä. Mikäli pelaaja ei valehdellut, hän saa jatkaa pelaamista tyhjään pöytään. Mikäli hän valehteli, siirtyy vuoro oikein
          epäilleelle pelaajalle.
        </p>
      </div>
    </div>
  );
  
}

export default Rules;