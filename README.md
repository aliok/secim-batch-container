### Kurulum:

```
npm install
```

### Baslatma:

```
BATCH_INDEX=0 BATCH_SIZE=5 npm start
```

### Endpointler:

- <localhost:3000/status>: `RUNNING` veya `DONE` olabilir.

- <localhost:3000/result>: Islem bittiginde, yani `status` `DONE` oldugunda, buradan verdiginiz batch icin sonuclari alabilirsiniz. Ornegin:

```json
{
  "&#x130;STANBUL/ADALAR/1006": {
    "A": {
      "votes": {
        "txtCHP": "131",
        "txtAKP": "66",
        "txtSAADET": "0",
        "txtDSP": "30"
      },
      "info": {
        "tbMvKayitliSecmenSayisi": "341",
        "tbMvOyKullananKayitliSecmenSayisi": "236",
        "tbMvKanunGeregiOyKullananSayisi": "0",
        "tbMvKullanilanToplamOy": "236",
        "tbMvItirazsizGecerliOySayisi": "0",
        "tbMvItirazliGecerliOySayisi": "0",
        "tbMvGecerliOySayisi": "227",
        "tbMvGecersizOySayisi": "9",
        "lblIlIlceBaslik": "&#x130;STANBUL/ADALAR/1006",
        "lblMvOzetSandikAlani": "H&#xDC;SEY&#x130;N RAHM&#x130; G&#xDC;RPINAR L&#x130;SES&#x130;",
        "lblMvGelisZamani": "31.03.2019 23:53:26"
      }
    },
    ...
}
```

- <localhost:3000/errors>: Alinamayan/islenemeyen sandik bilgilerini verir.

### Docker

Once image olusturalim:

```
docker build . -t aliok/secim-batch-container
```

Calistiralim:

```
docker run -e BATCH_SIZE=5 -e BATCH_INDEX=10 -p 3000:3000 aliok/secim-batch-container
```

Kubernetes uzerinde tek pod calistirma:

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