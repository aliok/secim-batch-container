### Introduction / Giris

This container is created to crawl the 2019 election results in Turkey. It opens the "election result tracking" system of a particular political party
in a headless browser (using Puppeteer) and clicks around to view different parts of a single box. ("box" here means a group of votes, a concept to make things easier when counting votes).
Results retrieved will be served over an endpoint on the container, available to be picked by an operator that manages the containers.

This project is implemented as a practice on learning the Kubernetes Operators. The operator that manages the pods is here: 

------

Bu container 2019 yerel secimlerinin sandik sonuclarini toplamak icin olusturuldu. Container bir headless browser uzerinde CHP'nin secim sistemini acip, batch icinde verilen sandiklar icin
degisik secim sonuclarini (ilce belediye, genel meclis, buyuksehir) toplar ve bunu bir endpoint uzerinden verir. Bu endpoint daha sonra bir operator tarafindan kullanilip sonuclar toparlanir.

Bu projeyi Kubernetes operatorleri uzerinde pratik yapmak icin yaptim. Operatoru surada bulabilirsiniz.

### Room for Improvement / Yapilabilir Gelistirmeler

1. Boxes to crawl the data is currently embedded in the source tree. It can be externalized.
2. Only the boxes in Istanbul are in that box list.
3. Crawling and HTML parsing can be externalized in a script to make the container generic

------

1. Sandik listesi su anda kod icinde. Bu haricten verilebilir.
2. Sadece Istanbul sandiklari var bu listede.
3. Crawl ve HTML isleme aslinda bir script vererek yapilabilir. Bu sayede container daha umumi maksatli olur.

### Setup / Kurulum:

```
npm install
```

### Running the app / Baslatma:

```
BATCH_INDEX=0 BATCH_SIZE=5 npm start
```

### Endpoins / Endpointler:

- <localhost:3000/status>: Can be `RUNNING` or `DONE`. / `RUNNING` veya `DONE` olabilir.

- <localhost:3000/result>: 

When the retrieval is complete, which means `status` is `DONE`, result can be read for the given batch. For example:

Islem bittiginde, yani `status` `DONE` oldugunda, buradan verdiginiz batch icin sonuclari alabilirsiniz. Ornegin:

```json
{
  "&#x130;STANBUL/ARNAVUTK&#xD6;Y/1012": {
    "name": "&#x130;STANBUL/ARNAVUTK&#xD6;Y/1012",
    "url": "https://sts.chp.org.tr/SonucDetay.aspx?cmd=BybnnqLiI3MZLEjiuK+rDQ%3d%3d",
    "retrievalTimeMs": 1554455391898,
    "retrievalTimeHumanFriendly": "2019-04-05T09:09:51.898Z",
    "A": {
      "votes": {
        "txtAKP": "133",
        "txtHDP": "45",
        "txtIYI": "45",
        "txtSAADET": "1",
        "txtDP": "1",
        "txtDSP": "0",
        "txtBBP": "6"
      },
      "info": {
        "tbMvKayitliSecmenSayisi": "331",
        "tbMvOyKullananKayitliSecmenSayisi": "266",
        "tbMvKanunGeregiOyKullananSayisi": "0",
        "tbMvKullanilanToplamOy": "266",
        "tbMvItirazsizGecerliOySayisi": "0",
        "tbMvItirazliGecerliOySayisi": "0",
        "tbMvGecerliOySayisi": "246",
        "tbMvGecersizOySayisi": "20",
        "lblIlIlceBaslik": "&#x130;STANBUL/ARNAVUTK&#xD6;Y/1012",
        "lblMvOzetSandikAlani": "ARNAVUTK&#xD6;Y CUMHUR&#x130;YET ORTA OKULU",
        "lblMvGelisZamani": "1.04.2019 01:11:46"
      }
      ...
    },
  ... 
}
```

There will be a key in the output for each box. Votes are separated into 3 items: A, B and C for different things that the people voted on.

Uretilen JSON'da her sandik icin bir key var. Oy bilgileri A, B ve C diye ayrilmis vaziyette. Bunlar ilce belediye, genel meclis ve buyuksehir belediye icin olan oylar. 

- <localhost:3000/errors>: Lists the boxes that the system cannot retrieve/process info. Alinamayan/islenemeyen sandik bilgilerini verir.

### Running in Docker / Docker uzerinde calistirma

An image is already pushed to Docker hub: https://hub.docker.com/r/aliok/secim-batch-container

Docker Hub'da bir imaj var: https://hub.docker.com/r/aliok/secim-batch-container

```
docker pull aliok/secim-batch-container
docker run -e BATCH_SIZE=5 -e BATCH_INDEX=10 -p 3000:3000 aliok/secim-batch-container
```

Then go to the endpoints mentioned above.

Sonra yukarida bahsedilen endpointlere git.

### Building the Docker image / Docker imajini olusturma

Create and image first / Once image olusturalim:

```
docker build . -t aliok/secim-batch-container
```

Run it / Calistiralim:

```
docker run -e BATCH_SIZE=5 -e BATCH_INDEX=10 -p 3000:3000 aliok/secim-batch-container
```

Running a single pod on / Kubernetes uzerinde tek pod calistirma:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secim-batch-container-N
spec:
  containers:
    - image: aliok/secim-batch-container
      imagePullPolicy: IfNotPresent
      name: secim-batch-container
      env:
        - name: BATCH_SIZE
          value: "5"
        - name: BATCH_INDEX
          value: "5"
      ports:
        - containerPort: 3000
          protocol: TCP
  restartPolicy: Never
```

Scheduling multiple pods and managing them can be done using the operator mentioned in the introduction section.

Kubernetes uzerinde birden cok pod olusturma ve onlari yonetme, giris kisminda bahsedilen operator ile yapilabilir.