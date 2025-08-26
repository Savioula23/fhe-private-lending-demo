import { useEffect, useState } from "react";
import { Contract, BrowserProvider } from "ethers";
import { ABI } from "./abi";
import { initFhenix } from "./fhenix";
// The SDK is used dynamically inside helpers

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT as string; // set this in .env

function App() {
  const [ready, setReady] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider>();
  const [contract, setContract] = useState<Contract>();
  const [user, setUser] = useState<string>("");

  const [income, setIncome] = useState<string>("350000");
  const [debt, setDebt] = useState<string>("100000");
  const [payment, setPayment] = useState<string>("25000");
  const [decision, setDecision] = useState<{max?: bigint; rateBps?: bigint; eligible?: boolean; outstanding?: bigint}>({});

  useEffect(() => {
    (async () => {
      if (!(window as any).ethereum) { alert("Please install MetaMask"); return; }
      const { provider, signer, user } = await initFhenix();

      const c = new Contract(CONTRACT_ADDRESS, ABI, signer);
      setProvider(provider as BrowserProvider);
      setContract(c);
      setUser(user);
      setReady(true);
    })();
  }, []);

  const apply = async () => {
    if (!contract) return;
    const { client } = await initFhenix();
    const [encIncome, encDebt] = await client.encrypt(
      client.encryptable.uint64(BigInt(income)),
      client.encryptable.uint64(BigInt(debt))
    );
    const tx = await contract.apply(encIncome, encDebt);
    await tx.wait();
    alert("Application submitted!");
  };

  const fetchDecision = async () => {
    if (!contract) return;
    const { permit, client } = await initFhenix();
    const permission = permit.getPermission();
    const data = await contract.myDecision(permission);
    const [maxLoan, rateBps, eligible, outstanding] = await client.unseal(data);
    setDecision({ max: maxLoan as bigint, rateBps: rateBps as bigint, eligible: !!eligible, outstanding: outstanding as bigint });
  };

  const makePayment = async () => {
    if (!contract) return;
    const { client } = await initFhenix();
    const [encPayment] = await client.encrypt(client.encryptable.uint64(BigInt(payment)));
    const tx = await contract.pay(encPayment);
    await tx.wait();
    alert("Payment sent!");
    await fetchDecision();
  };

  if (!ready) return <div style={{ padding: 24 }}>Connecting to wallet…</div>;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>🔐 FHE Private Lending (Helium Testnet)</h1>
      <p>Connected as: <code>{user}</code></p>

      <section style={{ marginTop: 24 }}>
        <h2>Apply (encrypted)</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <label>Monthly Income
            <input value={income} onChange={e => setIncome(e.target.value)} />
          </label>
          <label>Monthly Debt
            <input value={debt} onChange={e => setDebt(e.target.value)} />
          </label>
          <button onClick={apply}>Submit Application</button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>My Decision (decrypts locally)</h2>
        <button onClick={fetchDecision}>Fetch Decision</button>
        <ul>
          <li>Eligible: {decision.eligible === undefined ? "—" : decision.eligible ? "Yes" : "No"}</li>
          <li>Rate (bps): {decision.rateBps ?? "—"}</li>
          <li>Max loan: {decision.max ?? "—"}</li>
          <li>Outstanding: {decision.outstanding ?? "—"}</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Make Payment (encrypted)</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <input value={payment} onChange={e => setPayment(e.target.value)} />
          <button onClick={makePayment}>Pay</button>
        </div>
      </section>

      <footer style={{ marginTop: 48, opacity: 0.8 }}>
        <small>Built on Fhenix Helium using @fhenixprotocol/contracts and fhenixjs.</small>
      </footer>
    </main>
  );
}

export default App;