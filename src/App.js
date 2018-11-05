import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

const axiosGitHubGraphQl = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {Authorization: 'bearer 684832c792c679ea07e07a9b0f34a54b8d56a4da'}
});

const getIssuesOfRepositoryQuery = () => `
  query ($organization: String!, $repository: String!) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        issues(last: 5, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
`;

const getIssuesOfRepository = path => {
  const [organization, repository] = path.split('/');

  return axiosGitHubGraphQl.post('', {
    query: getIssuesOfRepositoryQuery(organization, repository),
    variables: {organization, repository}
  });
};

const resolveIssuesQuery = queryResult => () => ({
  organization: queryResult.data.data.organization,
  errors: queryResult.data.errors,
});

class App extends Component {

  state = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null
  }

  componentDidMount() {
    this.onFetchFromGitHub(this.state.path);
  }

  onChange = event => {
    this.setState({path: event.target.value});
  }

  onSubmit = event => {
    this.onFetchFromGitHub(this.state.path);
    event.preventDefault();
  }

  onFetchFromGitHub = path => {
    getIssuesOfRepository(path).then(result => this.setState(resolveIssuesQuery(result)));
  }

  render() {
    const {path, organization} = this.state;

    return (
      <div className="App">
        <img src={logo} className="App-logo" alt="logo"/>
        <h1>React GraphQL</h1>
        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">
            Show open issues for https://github.com
          </label>
          <input
            type="text"
            id="url"
            onChange={this.onChange}
            style={{width: '300px'}}
            value={path}
          />
          <button type="submit">Search</button>

          <hr/>
          {organization ? (
            <Organization organization={organization}/>
          ) : <p>No information yet.</p>}
        </form>
      </div>
    );
  }
}

const Repository = ({repository}) => {
  return (
    <div>
      <p>
        <strong>In Repository:</strong>
        <a href={repository.url}>{repository.name}</a>
      </p>
      <ul>
        {repository.issues.edges.map(issue => (
          <li key={issue.node.id}>
            <a href={issue.node.url}>{issue.node.title}</a>
            <ul>
              {issue.node.reactions.edges.map(reaction => (
                <li key={reaction.node.id}>{reaction.node.content}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

const Organization = ({organization, errors}) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong:</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    )
  }
  return (
    <div>
      <p>
        <strong>Issues from Organization:</strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
      <Repository repository={organization.repository}/>
    </div>
  )
};


export default App;
