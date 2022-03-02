import "./styles.css";

import React from "react";

export default function App() {
  const [speciesName, setSpeciesName] = React.useState("rattata");

  function handleSpeciesChange(event) {
    // setSpeciesName(event.target.value);
  }

  function handleSubmit(event) {
    setSpeciesName(event.target.elements["species-name"].value);
    console.log("set species name");
    event.preventDefault();
  }

  return (
    <div className="App">
      <div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="species-name">species name</label>
          <input id="species-name" defaultValue={speciesName} />
        </form>
      </div>
      <div>
        <Descendants root={speciesName} />
      </div>
    </div>
  );
}

export function Descendants(props) {
  // empty, requesting, resolved, error
  const [state, setState] = React.useState("empty");
  const [descendants, setDescendants] = React.useState([]);

  async function updateChain(chain_url) {
    console.log(chain_url);
    let chain_resp = await fetch(chain_url);
    let chain_json = await chain_resp.json();

    let all_descendants = [];
    function recurse(evolves_to) {
      all_descendants.push(
        ...evolves_to.map((descendant) => descendant.species.name)
      );
      for (const e of evolves_to) {
        if (e.evolves_to) {
          recurse(e.evolves_to);
        }
      }
    }

    recurse(chain_json.chain.evolves_to);
    setDescendants(all_descendants);
    setState(all_descendants === [] ? "empty" : "resolved");
  }

  React.useEffect(() => {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${props.root}`;
    const headers = { "content-type": "application/json;charset=UTF-8" };
    let controller = new AbortController();
    setState("requesting");
    fetch(url, { headers: headers, signal: controller.signal })
      .then((resp) => resp.json())
      .then((json) => {
        if (json.evolution_chain.url) {
          updateChain(json.evolution_chain.url);
          controller = null; // indicates success.
        }
      })
      .catch((rejection) => setState("error"));

    // cleanup handler
    return () => {
      controller?.abort();
    };
  }, [props.root]);

  return (
    <div>
      {() => {
        switch (state) {
          case "empty":
            return <span>Enter a valid species name</span>;
          case "requesting":
            return <span>Looking up descendants</span>;
          case "resolved":
            return descendants.map((d) => <span>{d} </span>);
          case "error":
            return <span>Error detected</span>;
          default:
            return <span>Something went wrong</span>;
        }
      }}
    </div>
  );
}
