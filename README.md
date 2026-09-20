# OnMaru-Frontend 

<br>

### 🚧 Building...

**"지금은 오직 우리만의 비밀 프로젝트, 세상에 공개될 날을 위해 열심히 빌드업 중! 🛠️"**

<br>

조금만 기다려주세요. 곧 특별한 모습으로 찾아뵙겠습니다. ✨
<br><br>

---

*본 프로젝트는 현재 비공개로 운영 중입니다.*

## 개발 환경 준비

```bash
git clone git@github.com:YRootLab/OnMaru-Frontend.git
cd OnMaru-Frontend
npm install
git submodule update --init --recursive
```

`src/private/core-ui`는 별도의 private 저장소(`YRootLab/onmaru-core-ui`)를 사용하는 Git submodule입니다. 동료가 로컬에서 submodule을 초기화하려면 해당 저장소에 접근 가능한 GitHub 계정으로 인증되어 있어야 합니다. 권한 오류가 발생하면 저장소 관리자에게 `onmaru-core-ui` collaborator 권한을 요청하세요.

### CI / 배포 인증

GitHub Actions가 private submodule을 읽을 수 있도록 Frontend 저장소 관리자만 `Settings → Secrets and variables → Actions`에 다음 repository secret을 등록합니다.

- Secret name: `CORE_UI_READ_TOKEN`
- 범위: `YRootLab/onmaru-core-ui`의 `Contents: Read-only`

토큰이나 private key는 동료에게 공유하거나 `.env.local`, `.env.example`, 소스 코드에 저장하지 않습니다. 동료의 로컬 개발에는 각자의 GitHub 저장소 접근 권한만 필요하며, CI secret을 로컬에 복사할 필요가 없습니다.